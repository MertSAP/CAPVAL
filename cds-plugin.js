const ServiceParser = require("./ServiceParser.js");
const MessageGenerator = require("./MessageGenerator.js");
const TraceGenerator = require("./TraceGenerator.js");
const HandlerProcessor = require("./HandlerProcessor.js");

cds.once("served", async () => {
  const odp = Object.defineProperty;
  const _global = (_, ...pp) =>
    pp.forEach((p) =>
      odp(global, p, {
        configurable: true,
        get: () => {
          const v = cds[_][p];
          odp(this, p, { value: v });
          return v;
        },
      })
    );
  _global("ql", "SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP");
  _global("parse", "CDL", "CQL", "CXL", "FROM");
  global.cds = cds;

  const serviceParser = new ServiceParser(cds.services);
  const entities = serviceParser.getEntities();
  const validationElements = serviceParser.getvalidationElements();

  // Implementation 1 - next is called before SQL is finished
  /*const errorHandler = function (error, req, res, next) {
    async function h() {
      let result = await SELECT.from("TravelService.Travel.drafts");
      console.log("SQL Finished");
      error.message = result[0].createdAt;
    }
    Promise.resolve().then(h).catch(next);
    console.log("before next");
    next(error);
  }; */

  // Implementation 2 - next is called in async function. Hangs
  /* const errorHandler = function (error, req, res, next) {
    async function h() {
      let result = await SELECT.from("TravelService.Travel.drafts");
      console.log("SQL Finished");
      error.message = result[0].createdAt;
      console.log("before next");
      next(error);
    }
    Promise.resolve().then(h).catch(next);
  };
  */

  // Implementation 3 -  async function. Hangs
  /*const errorHandler = async function (error, req, res, next) {
    const result = await cds.tx(req, async (tx) => {
      return await tx.run(SELECT.from("TravelService.Travel.drafts"));
    });

    error.message = result[0].createdAt;
    next(error);
  };*/

  // Implementation 4 -  result is a promise, but the message is returned.
  const errorHandler = function (error, req, res, next) {
    const result = cds.tx(req, async (tx) => {
      return await tx.run(SELECT.from("TravelService.Travel.drafts"));
    });

    console.log(result); //Its a promise
    error.message = "Please work";
    next(error);
  };

  cds.middlewares.after = [errorHandler];

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
        if (srv.name !== entity.ServiceName) continue;
        if (
          entity.isRoot &&
          (entity.HasValidations || entity.AncestorsHaveValidations)
        ) {
          srv.on("error", entity.EntityName, async (err, req) => {
            let details = [];
            if (err.details !== undefined) {
              details = err.details;
            } else {
              details.push(err);
            }

            const results = await cds.tx(req, async (tx) => {
              return await tx.run(
                SELECT.from(entity.EntityName + ".drafts").where(req._params[0])
              );
            });

            const messageGenerator = new MessageGenerator(req.locale);
            await messageGenerator.loadBundle();

            for (const detail of details) {
              let validationRule = validationElements.find(
                (item) =>
                  entity.ServiceName === item.ServiceName &&
                  entity.EntityName === item.EntityName &&
                  detail.target === item.FieldName
              );

              if (validationRule !== undefined) {
                const dataTracer = new TraceGenerator(
                  results.context.results,
                  entities,
                  srv.name
                );
                try {
                  var trace = dataTracer.performTrace(
                    detail.target,
                    entity.EntityName
                  );
                } catch (E) {}

                messageGenerator
                  .getMessage(validationRule.Message, trace, detail)
                  .then((message) => {});
              }
            }
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
                console.log(error);
                req.error(400, error.message, error.target);
              }
              return req;
            });
          }
        }
      }
    }
  }
});
