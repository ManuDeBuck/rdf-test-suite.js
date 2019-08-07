import { ITestCaseHandler } from "../ITestCaseHandler";
import { Resource } from "rdf-object";
import { ITestCaseData } from "../ITestCase";
import { IFetchOptions } from "../../Util";
import { ITestCaseSparql } from "./ITestCaseSparql";
import { IQueryEngine } from "./IQueryEngine";
import { TestCaseUnsupported } from "../TestCaseUnsupported";

/**
 * Test case handler for ldf tests.
 */
export class TestCaseLdfQueryEvaluationHandler implements ITestCaseHandler<TestCaseUnsupported> {

    constructor(){

    }

    public async resourceToTestCase(resource: Resource, testCaseData: ITestCaseData, options?: IFetchOptions): Promise<TestCaseUnsupported> {
        return new TestCaseUnsupported("", testCaseData);
    }

}

export class TestCaseLdfQueryEvaluation implements ITestCaseSparql {
    public readonly type = "sparql";
    public readonly approval: string;
    public readonly approvedBy: string;
    public readonly comment: string;
    public readonly types: string[];
    public readonly name: string;
    public readonly uri: string;

    constructor(){

    }

    public async test(engine: IQueryEngine, injectArguments: any): Promise<void> {
        return null;
    }
    
}