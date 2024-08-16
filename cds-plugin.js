const ServiceParser = require("./ServiceParser.js");
const MessageGenerator = require("./MessageGenerator.js");
const TraceGenerator = require("./TraceGenerator.js");
const HandlerProcessor = require("./HandlerProcessor.js");
const ErrorProcessor = require("./ErrorProcessor.js");
cds.once("served", async () => {
  const serviceParser = new ServiceParser(cds.services);
  const entities = serviceParser.getEntities();
  const validationElements = serviceParser.getvalidationElements();

  for (const validationElement of validationElements) {
    if (validationElement.Handler !== "") {
      const { default: Validater } = await await import(
        validationElement.Handler
      );
      validationElement.handlerClass = Validater;
    }
  }

  for (const srv of cds.services) {
    // go through all entities
    if (srv instanceof cds.ApplicationService) {
      for (const entity of entities) {
        if (srv.name !== entity.ServiceName) {
          continue;
        }
        if (
          entity.isRoot &&
          (entity.HasValidations || entity.AncestorsHaveValidations)
        ) {
          let errorProcessor = new ErrorProcessor(
            entity,
            validationElements,
            entities,
            srv.name
          );

          const errorHandler = async function (err, req, res, next) {
            try {
              let target = req._query.SELECT.from.ref[0].id + ".drafts";
              var whereClause = [];
              whereClause[req._query.SELECT.from.ref[0].where[0].ref[0]] =
                req._query.SELECT.from.ref[0].where[2].val;
              let results = await SELECT.from(target).where(whereClause);

              await errorProcessor.generateErrors(results[0], req.locale, err);
              res.status(err.statusCode);
              res.json({ error: err });
            } catch (exception) {
              next(exception);
            }
          };
          cds.middlewares.after = [errorHandler];

          srv.on("error", entity.EntityName, async (err, req) => {
            const results = await cds.tx(req, async (tx) => {
              return await tx.run(
                SELECT.from(entity.EntityName + ".drafts").where(req._params[0])
              );
            });

            await errorProcessor.generateErrors(
              results.context.results,
              req.locale,
              err
            );
          });

          if (
            entity.isRoot &&
            (entity.HasHandlers || entity.AncestorsHavehandlers)
          ) {
            srv.before("SAVE", entity.EntityName, async (req) => {
              if (!req.data) return;

              const myData = Array.isArray(req.data) ? req.data : [req.data];

              const handlerProcessor = new HandlerProcessor(
                myData,
                validationElements,
                entities,
                srv.name,
                req.locale
              );

              const errors = await handlerProcessor.validateData(
                entity.EntityName
              );

              for (const error of errors) {
                ///setting as 444 as the error hanlder is invoked after this and will change to 400 to prevent double handling
                req.error(444, error.message, error.target);
              }
            });
          }
        }
      }
    }
  }
});
