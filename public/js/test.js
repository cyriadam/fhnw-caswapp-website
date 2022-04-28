

const AllTat = () => {
    const allTatResults = [];
    const [TatResult, getTatId, getTatResult] = Tuple(2);
    const [UseCaseResult, getUseCaseId, getUseCaseSucceed, getUseCaseDesc] = Tuple(3);

    const add = (tatId, tatResult) => {
        const tat = TatResult(tatId, tatResult);
        allTatResults.push(tat);
    }

    const render = (containerElement) => {
        // console.log('render test results');
        let $templateSucceed = document.querySelector('#template-succeed').innerHTML;
        let $templateFails = document.querySelector('#template-failed').innerHTML;
        let $templateUseCase = document.querySelector('#template-usecase').innerHTML;
        let templateSucceed = (id, nb) => eval("`" +$templateSucceed+"`");
        let templateFails = (id, nbFails, nb, failsInnerHtml) => eval("`" +$templateFails+"`");
        let templateUseCase = (id, desc) => eval("`" +$templateUseCase+"`");

        allTatResults.forEach(tat => {
            // console.log(`- tat [${getTatId(tat)}] contains [${getTatResult(tat).length}] cases`);
            const tatResultComponent = getTatResult(tat).every(r => getUseCaseSucceed(r))?
                templateSucceed(getTatId(tat), getTatResult(tat).length):
                templateFails(
                    getTatId(tat), 
                    getTatResult(tat).filter(r => !getUseCaseSucceed(r)).length, 
                    getTatResult(tat).length, 
                    getTatResult(tat).reduce((prev, curr, idx) => prev+(getUseCaseSucceed(curr)?'':templateUseCase(getUseCaseId(curr), getUseCaseDesc(curr))), '')
                );
            containerElement.innerHTML+= tatResultComponent;
         });
    }
    
    return {
        render: render,
        add : add,
    }
};

const allTat = AllTat();

const Assert = (verbose=false) => {
    const useCaseResults = [];
    const [UseCaseResult, getUseCaseId, getUseCaseSucceed, getUseCaseDesc] = Tuple(3);

    const equals = (actual, expected, message) => {
        const succeed = (actual === expected);
        const desc=succeed?undefined:(message==undefined?`not equal! actual was '${actual}' but expected '${expected}'`:message)
        if(verbose&&desc) console.error(desc);
        useCaseResults.push(UseCaseResult(useCaseResults.length+1, succeed, desc));
    };

    return {
        equals : equals,
        getOk : () => useCaseResults.map(getUseCaseSucceed),
        getUseCaseResults : () => useCaseResults,
    }
}

const tat = (id, testCase, verbose=false) => {
    const assert = Assert(verbose);
    testCase(assert);
    allTat.add(id, assert.getUseCaseResults());
    return assert.getOk();
}


