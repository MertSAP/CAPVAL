const fs = require("fs");
var path = require("path");

//const { expect, GET, POST, PATCH, DELETE } = cds.test(__dirname + "/..");
const urlDraftBooks = "odata/v4/catalog-fiori/$batch";

module.exports = class BatchProcessor {
  constructor() {}

  async createBook(testPayload) {
    const payload = this.createBookPayload();
    let draftResp = await this.postBookWithHeaders(
      payload.body,
      true,
      payload.header
    );

    const book = this.createBookParseResponse(draftResp);

    const activatePayload = this.getActivatePayload(book.ID, testPayload);
    let activateResp = await this.postBookWithHeaders(
      activatePayload.body,
      true,
      activatePayload.header
    );
    //console.log(activateResp.data);
  }
  getCreateBookPayload() {
    return this.getPayload("create");
  }
  getEditBookPayload(bookUUID) {
    let payload = this.getPayload("edit");
    payload.body = this.replaceAll(payload.body, "UUID_REPLACE", bookUUID);
    return payload;
  }
  getPatchChapterPayload(chapterUUID, data) {
    let payload = this.getPayload("child_patch");
    payload.body = this.replaceAll(
      payload.body,
      "JSON_REPLACE",
      JSON.stringify(data)
    );
    payload.body = this.replaceAll(payload.body, "UUID_REPLACE", chapterUUID);

    return payload;
  }
  getCreateChapterPayload(bookUUID) {
    let payload = this.getPayload("child_create");
    payload.body = this.replaceAll(payload.body, "UUID_REPLACE", bookUUID);

    return payload;
  }

  createBookParseResponse(response) {
    return response.data.responses[0].body;
  }

  getActivatePayload(uuid, data) {
    let payload = this.getPayload("activate");
    payload.body = this.replaceAll(payload.body, "UUID_REPLACE", uuid);
    payload.body = this.replaceAll(
      payload.body,
      "JSON_REPLACE",
      JSON.stringify(data)
    );

    return payload;
  }

  getEditActivatePayload(uuid, data) {
    let payload = this.getPayload("edit_activate");
    payload.body = this.replaceAll(payload.body, "UUID_REPLACE", uuid);
    payload.body = this.replaceAll(
      payload.body,
      "JSON_REPLACE",
      JSON.stringify(data)
    );

    return payload;
  }

  getPayload(type) {
    let payload = {
      header: {
        headers: {
          "Content-Type":
            "multipart/mixed; boundary=batch_id-1723714275153-541",
        },
      },
      body: "",
    };
    const file = path.join("test", "batchrequests", type + ".txt");
    payload.body = fs.readFileSync(file, "utf-8");
    let regex = /\r?\n/g;
    payload.body = payload.body.replace(regex, "\r\n");
    return payload;
  }
  replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, "g"), replace);
  }
};
