const cds = require("@sap/cds");
const BatchProcessor = require("./BatchProcessor.js");
const { INSERT } = require("@sap/cds/lib/ql/cds-ql");
const { before } = require("@sap/cds/lib/srv/middlewares");

const urlBooks = "odata/v4/catalog/Books";
const urlDraftBooks = "odata/v4/catalog-fiori/$batch";

let yourDate = new Date();

const basePayload = {
  title: "201",
  stock: 1,
  releaseDate: yourDate.toISOString().split("T")[0],
  description: "capval 3",
  price: 3,
  statusCode: "A",
  reorderPoint: 6,
  to_Chapters: [
    {
      title: "Introduction",
    },
  ],
};

describe("Happy Days", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);
    let title = response.finalPostResponses[1].body.title;
    expect(title).to.eql(testPayload.title);
  });

  it("non drafts", async () => {
    let resp = await postBook(testPayload, false);
    let title = resp.data.title;
    expect(title).to.eql(testPayload.title);
  });
});

describe("Contextual Information", () => {
  let testPayload = {};
  let errorMessage = "Reorder Point: 21 not between 0 and 20";

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.reorderPoint = 21;
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);

    expect(response.finalPostResponses[2].body.error.message).to.eql(
      errorMessage
    );
  });
});

describe("Update", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
  });

  it("non drafts", async () => {
    let resp = await postBook(testPayload, false);
    let title = resp.data.title;
    expect(title).to.eql(testPayload.title);

    testPayload.releaseDate = null;
    let error = await patchBook(testPayload, resp.data.ID, false);

    expect(error.response.data.error.message).to.eql(
      "Release Date has to be to be set"
    );
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);
    let title = response.finalPostResponses[1].body.title;
    expect(title).to.eql(testPayload.title);
    testPayload.releaseDate = null;
    let editDraftResp = await editBookBatch(
      testPayload,
      response.finalPostResponses[1].body.ID
    );

    expect(editDraftResp.finalPostResponses[2].body.error.message).to.eql(
      "Release Date has to be to be set"
    );
  });
});

describe("Custom Handler", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.previewDate = "2024-01-01";
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);

    expect(response.finalPostResponses[2].body.error.message).to.eql(
      "Preview Date has to after today"
    );
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql(
      "Preview Date has to after today"
    );
  });
});

describe("Mandatory Annotation", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.releaseDate = null;
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);
    expect(response.finalPostResponses[2].body.error.message).to.eql(
      "Release Date has to be to be set"
    );
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql(
      "Release Date has to be to be set"
    );
  });
});

describe("Assert Format Annotation", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.description = "capval";
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);
    expect(response.finalPostResponses[2].body.error.message).to.eql(
      "Enter a valid description"
    );
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql(
      "Enter a valid description"
    );
  });
});

describe("Assert Range Annotation", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.stock = 10001;
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);
    expect(response.finalPostResponses[2].body.error.message).to.eql(
      "Stock can not be more than 10,000"
    );
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql(
      "Stock can not be more than 10,000"
    );
  });
});

describe("Localisation", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.price = null;
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);
    expect(response.finalPostResponses[2].body.error.message).to.eql(
      "Price must be set"
    );
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql("Price must be set");
  });
});

describe("Child Validations", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.to_Chapters[0].title = "";
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);

    expect(response.finalPostResponses[2].body.error.message).to.eql(
      "Enter a valid chapter title"
    );

    let target = `in/to_Chapters${getKey(response.chapters[0].ID)}/title`;
    expect(response.finalPostResponses[2].body.error.target).to.eql(target);
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql(
      "Enter a valid chapter title"
    );
    expect(error.response.data.error.target).to.eql("to_Chapters[0]/title");
  });
});

describe("Multiple Errors", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.to_Chapters[0].title = "";
    testPayload.description = "capval";
    testPayload.price = null;
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);
    expect(response.finalPostResponses[2].body.error.details[1].message).to.eql(
      "Price must be set"
    );

    expect(response.finalPostResponses[2].body.error.details[1].target).to.eql(
      "in/price"
    );

    expect(response.finalPostResponses[2].body.error.details[0].message).to.eql(
      "Enter a valid description"
    );
    expect(response.finalPostResponses[2].body.error.details[0].target).to.eql(
      "in/description"
    );
    expect(response.finalPostResponses[2].body.error.details[2].message).to.eql(
      "Enter a valid chapter title"
    );

    let target = `in/to_Chapters${getKey(response.chapters[0].ID)}/title`;

    expect(response.finalPostResponses[2].body.error.details[2].target).to.eql(
      target
    );
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);

    expect(error.response.data.error.details[1].message).to.eql(
      "Price must be set"
    );
    expect(error.response.data.error.details[1].target).to.eql("price");
    expect(error.response.data.error.details[0].message).to.eql(
      "Enter a valid description"
    );
    expect(error.response.data.error.details[0].target).to.eql("description");
    expect(error.response.data.error.details[2].message).to.eql(
      "Enter a valid chapter title"
    );
    expect(error.response.data.error.details[2].target).to.eql(
      "to_Chapters[0]/title"
    );
  });
});

describe("Conditional", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.price = 23;
    testPayload.statusCode = "C";
    testPayload.to_Chapters[0].title = "DEs";
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);

    expect(response.finalPostResponses[2].body.error.message).to.eql(
      "Please use remaining stock before cancelling"
    );
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql(
      "Please use remaining stock before cancelling"
    );
  });
});

describe("Custom Data", () => {
  let testPayload = {};
  let message = "";
  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.releaseDate = "2024-01-01";
    testPayload.statusCode = "R";

    message = `Release Date must be today: ${
      yourDate.toISOString().split("T")[0]
    }`;
  });

  it("drafts", async () => {
    let response = await createBookBatch(testPayload);

    expect(response.finalPostResponses[2].body.error.message).to.eql(message);
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql(message);
  });
});

function getKey(id, active = false) {
  return `(ID=${id},IsActiveEntity=${active})`;
}
function getKeyNonDraft(id) {
  return `(ID=${id})`;
}

const { expect, GET, POST, PATCH, DELETE } = cds.test(__dirname + "/..");

async function postBook(payload, draft) {
  let url = draft ? urlDraftBooks : urlBooks;
  let data;
  try {
    data = await POST(url, payload);
  } catch (e) {
    return e;
  }

  return data;
}

async function postWithHeaders(payload, draft, header) {
  let url = draft ? urlDraftBooks : urlBooks;
  let data;
  try {
    data = await POST(url, payload, header);
  } catch (e) {
    return e;
  }

  return data;
}

async function patchBook(payload, id, draft) {
  let url = draft ? urlDraftBooks : urlBooks;
  let key = draft ? getKey(id, false) : getKeyNonDraft(id);
  url = url + key;

  let data;
  try {
    data = await PATCH(url, payload);
  } catch (e) {
    return e;
  }

  return data;
}

async function editBookBatch(testPayload, bookUUID) {
  let responseStack = {
    final: {},
    chapters: [],
  };

  delete testPayload["to_Chapters"];

  const batchProcessor = new BatchProcessor();
  let payload = batchProcessor.getEditBookPayload(bookUUID);
  let draftResp = await postWithHeaders(payload.body, true, payload.header);

  const respEdit = batchProcessor.createBookParseResponse(draftResp);

  const activatePayload = batchProcessor.getEditActivatePayload(
    respEdit.ID,
    testPayload
  );
  let activateResp = await postWithHeaders(
    activatePayload.body,
    true,
    activatePayload.header
  );
  responseStack.finalPostResponses = activateResp.data.responses;
  return responseStack;
}
async function createBookBatch(testPayload) {
  let responseStack = {
    final: {},
    chapters: [],
  };
  let chapters = testPayload["to_Chapters"];
  delete testPayload["to_Chapters"];

  const batchProcessor = new BatchProcessor();
  let payload = batchProcessor.getCreateBookPayload(testPayload);
  let draftResp = await postWithHeaders(payload.body, true, payload.header);
  const respCreate = batchProcessor.createBookParseResponse(draftResp);

  for (let chapter of chapters) {
    let childPayload = batchProcessor.getCreateChapterPayload(respCreate.ID);
    let draftChildResp = await postWithHeaders(
      childPayload.body,
      true,
      childPayload.header
    );
    const respChildCreate =
      batchProcessor.createBookParseResponse(draftChildResp);

    responseStack.chapters.push(respChildCreate);

    const childPatchPayload = batchProcessor.getPatchChapterPayload(
      respChildCreate.ID,
      chapter
    );
    const respChild = await postWithHeaders(
      childPatchPayload.body,
      true,
      childPatchPayload.header
    );
  }
  const activatePayload = batchProcessor.getActivatePayload(
    respCreate.ID,
    testPayload
  );
  let activateResp = await postWithHeaders(
    activatePayload.body,
    true,
    activatePayload.header
  );
  responseStack.finalPostResponses = activateResp.data.responses;
  return responseStack;
}
