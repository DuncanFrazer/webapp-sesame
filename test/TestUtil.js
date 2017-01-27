const mocha = require("mocha");
const expect = require("chai").expect;
const Utils = require("../api_v1/helpers/Utils");

mocha.describe("preparePrevNextLinks", function() {
   mocha.it("no items", function() {
       const links = Utils.preparePrevNextLinks("http://baseurl", 0, 10, 0);
       expect(links.length).to.equal(0);
   });

   mocha.it("First page, items less then page size", function() {
       const links = Utils.preparePrevNextLinks("http://baseUrl", 0, 10, 3);
       expect(links.length).to.equal(0);
   });

    mocha.it("First page, items more then page size", function() {
        const links = Utils.preparePrevNextLinks("http://baseUrl", 0, 10, 13);
        expect(links.length).to.equal(1);
        expect(links[0].rel).to.equal("next");
    });

    mocha.it("Non zero startIndex, items less then page size", function() {
        const links = Utils.preparePrevNextLinks("http://baseUrl", 3, 10, 7);
        expect(links.length).to.equal(1);
        expect(links[0].rel).to.equal("prev");
        expect(links[0].href).to.contain("startIndex=0");
    });

    mocha.it("Non zero startIndex, items more then page size", function() {
        const links = Utils.preparePrevNextLinks("http://baseUrl", 3, 10, 17);
        expect(links.length).to.equal(2);
        expect(links[0].rel).to.equal("prev");
        expect(links[0].href).to.contain("startIndex=0");
        expect(links[1].rel).to.equal("next");
        expect(links[1].href).to.contain("startIndex=13");
    });

    mocha.it("Non zero startIndex, items length exactly fit current page", function() {
        const links = Utils.preparePrevNextLinks("http://baseUrl", 1, 10, 11);
        expect(links.length).to.equal(1);
        expect(links[0].rel).to.equal("prev");
        expect(links[0].href).to.contain("startIndex=0");
    });

    mocha.it("3rd page", function() {
        const links = Utils.preparePrevNextLinks("http://baseUrl", 15, 10, 50);
        expect(links.length).to.equal(2);
        expect(links[0].rel).to.equal("prev");
        expect(links[1].rel).to.equal("next");
        expect(links[0].href).to.contain("startIndex=5");
        expect(links[1].href).to.contain("startIndex=25");
    });
});