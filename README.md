# Extend SAP Cloud Application Programming Model(CAP) Validations with the CAPVAL Plugin
SAP CAPVAL is a SAP Cloud Application Programming Model(CAP) plugin that aims to improve and extend the standard validations provided. 

This plugin aims to address the following:
* Poor User Experience with default messages such as 'Value is required'. With a multilevel application with many mandatory fields this can leave the user feeling lost
* Large handlers for custom validations/messages to address the above
* Repetitive development implementing custom validations such as generating targets

## Setup
To use CAPVAL, simply add the dependency to your project

For @CAP/SAP version less than 8.0.0 use CAPVAL version < 2. Use CAPVAL version 2 and above for @CAP/SAP version 8.0.0 and above

```sh
npm add capval
```
# Annotations
## Custom Messages with contextual information
To override messages all we need to do is place the @validation.message annotation alongside existing input validation annotations 
### Examples
#### Custom Message
  
  ```cds
  db/validations.cds

   using { sap.fe.cap.travel as schema } from '../db/schema';

  annotate schema.Travel {
      @validation.message: 'Enter a valid begin date'
      @mandatory
      BeginDate;
  }
```
### Localisation 
 Localisation is supported and dynamic contextual information can be provided.
```cds
db/validations.cds

using { sap.fe.cap.travel as schema } from '../db/schema';

annotate schema.Travel {
    @validation.message: 'i18n>begindate-error'
    @mandatory
    BeginDate;
}

_i18n/i18n.properties

begindate-error = Enter a valid begin date

  ```

### Localisation with contextual information

```cds
db/validations.cds
using { sap.fe.cap.travel as schema } from '../db/schema';

annotate schema.Travel {
    @validation.message: 'i18n>begindate-error'
    @mandatory
    BeginDate;
}

_i18n/i18n.properties
begindate-error = Begin Date required and must be before End Date {{Travel-EndDate}}
   ```
## Custom Validations 
The introduced annotation @validation.handler allows a class to be specified that implements a custom validation. This allows for modulisation and reuse of validations. Implementations must extend the BaseValidation class and implement the IsValid Method, returning true or false. CAPVAL will automatically determine the targets (in/to_Booking(BookingUUID etc etc), collate, and return the errors. 

### Example 
#### Custom Validation
This handler checks that the begin date is before the end date
```js
srv/handlers/BeginDateChecks.js

const BaseValidation = require("capval");
module.exports = class BeginDateChecks extends BaseValidation {
  isValid(InputValue) {
    var travel = this.getNode()

    if (travel.BeginDate > travel.EndDate) {
      return false
    }

    return true
  }
};
```
```cds
db/validations.cds
using { sap.fe.cap.travel as schema } from '../db/schema';

annotate schema.Travel {
    @validation: {
        message: 'Please enter a begin date that is before the end date',
        handler: 'srv/handlers/BeginDateChecks.js'
    }
   BeginDate;
}

```

#### Advanced Scenario
A generic conditional validation with dynamic error messages

```js
srv/handlers/ConditionalMandatoryCheck.js

const BaseValidation = require('capval')
module.exports = class ConditionalMandatoryCheck extends BaseValidation {
    isValid(InputValue) {
       var data = this.getDataToRoot()
       if(data['Travel-TravelStatus_code'] === 'X') return true
        if(!InputValue) {
            this.seti18nMessage(this.getField()+ '-errorMessage')
            return false
        }
        return true
    }
}
```
```cds
db/validations.cds
using { sap.fe.cap.travel as schema } from '../db/schema';
annotate schema.Travel {
    @validation: {
        message: 'Default message',
        handler: 'srv/handlers/ConditionalMandatoryCheck.js'
    }
   BeginDate;
   @validation: {
        message: 'Default message',
        handler: 'srv/handlers/ConditionalMandatoryCheck.js'
    }
   EndDate;
}

_i18n/i18n.properties
BeginDate-errorMessage = Please enter a valid begin date
EndDate-errorMessage = Please enter a valid end date
```
#### Custom Data Scenario
Custom Variables, that are not part of the Business Object can be added to provide information in messages.
```js
srv/handlers/BeginDateChecks.js

const BaseValidation = require('capval')
module.exports = class BeginDateChecks extends BaseValidation {
    isValid(InputValue) {
       var travel = this.getNode();
       var today =(new Date).toISOString().slice(0,10)
      
       if(travel.BeginDate < today) {
        this.seti18nMessage("begindatetoday-errorMessage")
        this.setCustomMessageVariables({ today: today})
        return false
       }
      

        return true
    }
}
```
```cds
db/validations.cds
using { sap.fe.cap.travel as schema } from '../db/schema';
annotate schema.Travel {
    @validation: {
        message: 'Please enter a begin date that is before the end date',
        handler: 'srv/handlers/BeginDateChecks.js'
    }
   BeginDate;
}
  
_i18n/i18n.properties
begindatetoday-errorMessage = Travel Begin Date {{Travel-BeginDate}} can not be before today {{custom-today}}
```

### Methods
The following getter methods can be used to access information to assist with the validation:
1. getField() : Returns the technical name of the Field getting validated. For Example: BeginDate
2. getNode() :  Returns the Entity Data for which the Field is member of. For example: The Travel Instance
3. getMessage() : Returns the annotated error message
4. getTarget() : Returns the calculated target
5. getDataToRoot(): Returns a flat JSON Object(keys prefixed with the Entity Name-) of the Node under validation as well as its parents to root
6. getData(): Returns the full data(root with all ancestors) of the instance

The following setter methods are available:
1. setMessage(Message): Overwrites the Error Message. Variables in double curly brackets can be provided
2. seti18nMessage(Message): Overwrites the Error Message by providing a key for an entry in the i18n.properties file
3. setTarget(Target): Overwrites the generated field target
4. setCustomMessageVariables(data): Allows a JSON Object with custom key value pairs to be used in error messages

## Demo

SFLIGHT Scenario with CAPVAL
https://github.com/MertSAP/cap-sflight




