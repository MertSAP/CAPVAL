const MessageGenerator = require("./MessageGenerator.js");
/* const TraceGenerator = require("./TraceGenerator.js"); */
const errorHandler = async function (err, req, res, next) {
  const locale=cds.context.locale || 'en'
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

