const MessageGenerator = require("./MessageGenerator.js");
const HandlerProcessor = require("./HandlerProcessor.js");
const path = require('path')
/* const TraceGenerator = require("./TraceGenerator.js"); */
const errorHandler = async function (err, req, res, next) {
  if (!err.target ||err.message !== 'Value is required') {
    res.statusCode = 400;
    res.json({ error: err });
    return res
  };
  const locale = cds.context.locale || 'en'
  const messageGenerator = new MessageGenerator(locale);
  await messageGenerator.loadBundle();
  let property = err.target
  if (property.startsWith('in/')) {
    property = err.target.split("in/")[1]
  }
  let element = req._query.elements[property]
  if (element['@validation.message']) {
    err.message = await messageGenerator.getText(
      element['@validation.message'],
    );
  }
  res.status(err.statusCode);
  res.json({ error: err });
  return res
};
cds.middlewares.after = [errorHandler];

cds.once("served", async () => {

  for (let srv of cds.services) {
    for (let entity of srv.entities) {

      srv.before("SAVE", entity.EntityName, async (req) => {

        if (!req.data) return;

        const myData = Array.isArray(req.data) ? req.data : [req.data];

        const handlerProcessor = new HandlerProcessor(
          myData,
          entity.elements,
          srv.entities,
          srv.name,
          req.locale
        );

        const errors = await handlerProcessor.validateData(
          entity.EntityName
        );

        for (const error of errors) {
          console.log(error);
          req.error(400, error.message, error.target);
        }
        return req;
      });
    }
  }
})

