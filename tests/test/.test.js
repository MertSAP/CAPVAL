const cds = require("@sap/cds");
const { INSERT } = require("@sap/cds/lib/ql/cds-ql");
const { before } = require("@sap/cds/lib/srv/middlewares");

const urlBooks = "odata/v4/catalog/Books";
const urlDraftBooks = "odata/v4/catalog-fiori/Books";

let yourDate = new Date();

const basePayload = {
  title: "201",
  stock: 1,
  releaseDate: yourDate.toISOString().split("T")[0],
  description: "capval 3",
  price: 3,
  reorderPoint: 6,
  to_Chapters: [
    {
      title: "Introduction",
    },
  ],
};

function getActivateURL(id) {
  return urlDraftBooks + getKey(id) + "/CatalogFioriService.draftActivate";
}

function getEditURL(id) {
  return urlDraftBooks + getKey(id, true) + "/CatalogFioriService.draftEdit";
}

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

async function activateBook(data) {
  const activateURL = getActivateURL(data.data.ID);
  let resp;
  try {
    resp = await POST(activateURL, {});
  } catch (e) {
    return e;
  }
  return resp;
}
async function editDraftBook(data) {
  const editURL = getEditURL(data.data.ID);
  let resp;
  try {
    resp = await POST(editURL, {
      PreserveChanges: true,
    });
  } catch (e) {
    return e;
  }
  return resp;
}

async function getBook(data) {
  let url = `${urlDraftBooks}${getKey(data.data.ID)}?$expand=to_Chapters`;
  let resp;
  try {
    resp = await GET(url);
  } catch (e) {
    return e;
  }
  return resp;
}

describe("Happy Days", () => {
  let testPayload = {};

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
  });

  it("drafts", async () => {
    let draftResp = await postBook(testPayload, true);
    let resp = await activateBook(draftResp);

    let title = resp.data.title;
    expect(title).to.eql(testPayload.title);
  });

  it("non drafts", async () => {
    let resp = await postBook(testPayload, false);
    let title = resp.data.title;
    expect(title).to.eql(testPayload.title);
  });
});
/*
describe("Contextual Information", () => {
  let testPayload = {};
  let errorMessage = "Reorder Point: 21 not between 0 and 20";

  beforeEach(() => {
    testPayload = Object.assign({}, basePayload, {});
    testPayload.reorderPoint = 21;
  });

  it("drafts", async () => {
    let resp = await postBook(testPayload, true);
    let error = await activateBook(resp);
    expect(error.response.data.error.message).to.eql(errorMessage);
  });

  it("non drafts", async () => {
    let error = await postBook(testPayload, false);
    expect(error.response.data.error.message).to.eql(errorMessage);
  });
});
*/
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
    let respDraft = await postBook(testPayload, true);
    let respDraftActivate = await activateBook(respDraft);
    let title = respDraftActivate.data.title;
    expect(title).to.eql(testPayload.title);

    let editDraftResp = await editDraftBook(respDraftActivate);
    testPayload.releaseDate = null;

    let patchResp = await patchBook(
      { releaseDate: null },
      editDraftResp.data.ID,
      true
    );
    let error = await activateBook(patchResp);
    expect(error.response.data.error.message).to.eql(
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
    let resp = await postBook(testPayload, true);
    let error = await activateBook(resp);
    expect(error.response.data.error.message).to.eql(
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
    let resp = await postBook(testPayload, true);
    let error = await activateBook(resp);
    expect(error.response.data.error.message).to.eql(
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
    let resp = await postBook(testPayload, true);
    let error = await activateBook(resp);
    expect(error.response.data.error.message).to.eql(
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
    let resp = await postBook(testPayload, true);
    let error = await activateBook(resp);
    expect(error.response.data.error.message).to.eql(
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
    let resp = await postBook(testPayload, true);
    let error = await activateBook(resp);
    expect(error.response.data.error.message).to.eql("Price must be set");
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
    let resp = await postBook(testPayload, true);
    let error = await activateBook(resp);
    expect(error.response.data.error.message).to.eql(
      "Enter a valid chapter title"
    );
    let book = await getBook(resp);
    let message = `in/to_Chapters${getKey(book.data.to_Chapters[0].ID)}/title`;
    expect(error.response.data.error.target).to.eql(message);
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
    let resp = await postBook(testPayload, true);
    let error = await activateBook(resp);
    expect(error.response.data.error.details[1].message).to.eql(
      "Price must be set"
    );
    expect(error.response.data.error.details[1].target).to.eql("in/price");
    expect(error.response.data.error.details[0].message).to.eql(
      "Enter a valid description"
    );
    expect(error.response.data.error.details[0].target).to.eql(
      "in/description"
    );
    expect(error.response.data.error.details[2].message).to.eql(
      "Enter a valid chapter title"
    );

    let book = await getBook(resp);
    let message = `in/to_Chapters${getKey(book.data.to_Chapters[0].ID)}/title`;
    expect(error.response.data.error.details[2].target).to.eql(message);
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
