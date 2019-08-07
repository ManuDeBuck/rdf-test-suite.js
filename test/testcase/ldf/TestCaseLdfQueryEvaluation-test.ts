import { TestCaseLdfQueryEvaluation, TestCaseLdfQueryEvaluationHandler } from "../../../lib/testcase/ldf/TestCaseLdfQueryEvaluation";
const quad = require("rdf-quad");
import * as RDF from "rdf-js";
import { QueryResultQuads } from "../../../lib/testcase/sparql/QueryResultQuads";
import { Resource } from "rdf-object";
import { namedNode, literal } from "@rdfjs/data-model";
import { ContextParser } from "jsonld-context-parser";
import "jest-rdf";

// tslint:disable:no-var-requires
const streamifyString = require('streamify-string');

// Mock fetch
(<any> global).fetch = (url: string) => {
  let body;
  let headers = new Headers({ a: 'b' });
  switch (url) {
  case 'ACTION.ok':
    body = streamifyString(`OK`);
    break;
  case 'ACTION.invalid':
    body = streamifyString(`INVALID`);
    break;
  case 'RESULT.ttl':
    body = streamifyString(`@prefix : <http://ex.org#> . :s1 :o1 "t1", "t2".`);
    headers = new Headers({ 'Content-Type': 'text/turtle' });
    break;
  default:
    return Promise.reject(new Error('Fetch error'));
    break;
  }
  return Promise.resolve(new Response(body, <any> { headers, status: 200, url }));
};

describe('TestCaseLdfQueryEvaluation', () => {

  const handler = new TestCaseLdfQueryEvaluationHandler();
  const engine = {
    parse: (queryString: string) => queryString === 'OK'
      ? Promise.resolve(null) : Promise.reject(new Error('Invalid data ' + queryString)),
    query: (data: RDF.Quad[], queryString: string) => Promise.resolve(new QueryResultQuads([
      quad('http://ex.org#s1', 'http://ex.org#o1', '"t1"'),
      quad('http://ex.org#s1', 'http://ex.org#o1', '"t2"'),
    ])),
  };

  let context;
  let pAction;
  let pQuery;
  let pResult;
  let pSourceType;
  let pTPF;
  let pData;

  beforeEach((done) => {
    new ContextParser().parse(require('../../../lib/context-manifest.json'))
      .then((parsedContext) => {
        context = parsedContext;

        pAction = new Resource(
          { term: namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#action'), context });
        pQuery = new Resource(
          { term: namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-query#query'), context });
        pResult = new Resource(
          { term: namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result'), context });
        pSourceType = new Resource(
          { term: namedNode('https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#sourceType'), context });
        pTPF = new Resource(
          { term: namedNode('https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#RDF'), context });
        pData = new Resource(
          { term: namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-query#data'), context });

        done();
      });
  });

  // Urls representing the possible sourceTypes for a TestCaseLdfQueryEvaluationhandler
  let tpfUrl : string = 'https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#RDF';

  describe('#resourceToTestCase', () => {
    it('should produce a TestCaseLdfQueryEvaluation without data', async () => {
      const resource = new Resource({ term: namedNode('http://example.org/test'), context });
      const action = new Resource({ term: namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: literal('ACTION.ok'), context }));
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: literal('RESULT.ttl'), context }));
      resource.addProperty(pSourceType, pTPF);
      const testcase = await handler.resourceToTestCase(resource, <any> {});

      expect(testcase).toBeInstanceOf(TestCaseLdfQueryEvaluation);
      expect(testcase.type).toEqual('ldf');
      expect(testcase.queryString).toEqual('OK');
      expect(testcase.queryResult.type).toEqual('quads');
      expect(testcase.querySource).toEqual('');
      expect(testcase.queryResult.value).toBeRdfIsomorphic([
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t1"'),
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t2"'),
      ]);
      expect(testcase.sourceType).toEqual(tpfUrl);
    });

    it('should error on a resource without action', () => {
      const resource = new Resource({ term: namedNode('http://example.org/test'), context });

      return expect(handler.resourceToTestCase(resource, <any> {})).rejects.toBeTruthy();
    });

    it('should error on a resource without result', () => {
      const resource = new Resource({ term: namedNode('http://example.org/test'), context });
      const action = new Resource({ term: namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: literal('ACTION.ok'), context }));
      resource.addProperty(pAction, action);

      return expect(handler.resourceToTestCase(resource, <any> {})).rejects.toBeTruthy();
    });

    it('should error on a resource without query', () => {
      const resource = new Resource({ term: namedNode('http://example.org/test'), context });
      const action = new Resource({ term: namedNode('blabla'), context });
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: literal('RESULT.ttl'), context }));

      return expect(handler.resourceToTestCase(resource, <any> {})).rejects.toBeTruthy();
    });

    it('should error on a resource without sourceType', () => {
      const resource = new Resource({ term: namedNode('http://example.org/test'), context });
      const action = new Resource({ term: namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: literal('ACTION.ok'), context }));
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: literal('RESULT.ttl'), context }));

      return expect(handler.resourceToTestCase(resource, <any> {})).rejects.toBeTruthy();
    });

    it('should produce a TestCaseLdfQueryEvaluation with data in action', async () => {
      const resource = new Resource({ term: namedNode('http://example.org/test'), context });
      const action = new Resource({ term: namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: literal('ACTION.ok'), context }));
      action.addProperty(pData, new Resource({ term: namedNode('RESULT.ttl'), context }));
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: literal('RESULT.ttl'), context }));
      resource.addProperty(pSourceType, pTPF);
      const testcase = await handler.resourceToTestCase(resource, <any> {});

      expect(testcase).toBeInstanceOf(TestCaseLdfQueryEvaluation);
      expect(testcase.type).toEqual('ldf');
      expect(testcase.queryString).toEqual('OK');
      expect(testcase.querySource).toEqual('RESULT.ttl');
      expect(testcase.queryResult.type).toEqual('quads');
      expect(testcase.queryResult.value).toBeRdfIsomorphic([
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t1"'),
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t2"'),
      ]);
      expect(testcase.sourceType).toEqual(tpfUrl);
    });

  });

});