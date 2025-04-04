import "@testing-library/jest-dom";
// jest.setup.js
global.ResizeObserver = class {
    constructor(callback) {
        // You can store the callback or leave it empty if you don't need it.
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};
import fetchMock from "jest-fetch-mock";
fetchMock.enableMocks();
