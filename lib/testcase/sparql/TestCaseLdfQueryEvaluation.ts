import {ITestCaseHandler } from "../ITestCaseHandler";
import * as RDF from 'rdf-js';
import {Resource, RdfListMaterializer } from "rdf-object";
import {ITestCaseData } from "../ITestCase";
import {IFetchOptions, Util, IFetchResponse } from "../../Util";
import {ITestCaseSparql } from "./ITestCaseSparql";
import {IQueryEngine, IQueryResult } from "./IQueryEngine";
import {TestCaseUnsupported } from "../TestCaseUnsupported";
import {TestCaseQueryEvaluationHandler} from "./TestCaseQueryEvaluation";
// tslint:disable:no-var-requires
const arrayifyStream = require('arrayify-stream');
const stringifyStream = require('stream-to-string');


/**
 * Test case handler for https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#LdfQueryEvaluationTest
 */
export class TestCaseLdfQueryEvaluationHandler implements ITestCaseHandler<TestCaseLdfQueryEvaluation> {

    constructor(){

    }

    public async resourceToTestCase(resource: Resource, testCaseData: ITestCaseData, options?: IFetchOptions): Promise<TestCaseLdfQueryEvaluation> {
        if(!resource.property.action) {
            throw new Error(`Missing mf:action in ${resource}`);
        }
        if(!resource.property.result) {
            throw new Error(`Missing mf:reslult in ${resource}`);
        }
        const action = resource.property.action;
        if(!action.property.query){
            throw new Error(`Missing qt:query in mf:action of ${resource}`);
        }
        // Check if Ldf source is stated
        if(!resource.property.sourceType){
            throw new Error(`Missing et:sourceType in ${resource}`);
        }
        
        let dataUri: string = null;
        if(action.property.data){
            dataUri = action.property.data.value;
        }

        let queryData: RDF.Quad[] = dataUri ? await arrayifyStream((await Util.fetchRdf(dataUri, options))[1]) : [];
        const queryResponse = await Util.fetchCached(resource.property.result.value, options);
        return new TestCaseLdfQueryEvaluation(
            testCaseData,
            {
                baseIRI: Util.normalizeBaseUrl(action.property.query.value),
                queryString: await stringifyStream((await Util.fetchCached(action.property.query.value, options)).body),
                queryData: queryData,
                queryResult: await TestCaseQueryEvaluationHandler.parseQueryResult(
                    Util.identifyContentType(queryResponse.url, queryResponse.headers),
                    queryResponse.url, queryResponse.body),
                resultSource: queryResponse,
                sourceType: resource.property.sourceType.value
            }
        );
    }

}

export interface ILdfTestaseQueryEvaluationProps {
    baseIRI: string;
    queryString: string;
    queryData: RDF.Quad[];
    queryResult: IQueryResult;
    resultSource: IFetchResponse;
    // Necessary for testing different sourceTypes
    sourceType: string;
}

export class TestCaseLdfQueryEvaluation implements ITestCaseSparql {
    public readonly type = "sparql";
    public readonly approval: string;
    public readonly approvedBy: string;
    public readonly comment: string;
    public readonly types: string[];
    public readonly name: string;
    public readonly uri: string;

    public readonly baseIRI: string;
    public readonly queryString: string;
    public readonly queryData: RDF.Quad[];
    public readonly queryResult: IQueryResult;
    public readonly resultSource: IFetchResponse;
    public readonly sourceType: string;

    constructor(testCaseData: ITestCaseData, props: ILdfTestaseQueryEvaluationProps){
        Object.assign(this, testCaseData);
        Object.assign(this, props);
    }

    public async test(engine: IQueryEngine, injectArguments: any): Promise<void> {
        // TODO: Implement test
    }
    
}