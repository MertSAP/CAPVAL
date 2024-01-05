# Background
SAP CAPVAL is a SAP Cloud Application Programming Model(CAP) plugin that aims to improve and extend the standard validations provided. 

This plugin aims to address the following:
* Poor User Experience with default messages such as 'Value is required'. With a multilevel applications with many mandatory fields this can leave the user feeling lost
* Large handlers for custom validations/messages to address the above
* Repeatitive developement implementing custom validations such as generating targets

# Features
## Custom Messages with contextual information
The introduced @validation.message annonation works alongside existing input validation annocations to overwrite default messages. Localisation is supported and dynamic contextual information can be provided.
### Examples
#### Custom Message
  
  ```
  db/schema.cds

    entity BookingSupplement : managed {
      key BookSupplUUID   : UUID;
      BookingSupplementID : Integer @Core.Computed;
      Price               : Decimal(16, 3) @mandatory @validation.message = 'Please enter a price for booking supplement';
      CurrencyCode        : Currency;
      to_Booking          : Association to Booking;
      to_Travel           : Association to Travel;
      to_Supplement       : Association to Supplement;
    };
```
### Localisation 
```
db/schema.cds

entity BookingSupplement : managed {
  key BookSupplUUID   : UUID;
  BookingSupplementID : Integer @Core.Computed;
  Price               : Decimal(16, 3) @mandatory @validation.message = 'i18n>BookingSupp-PriceErrorMessage';
  CurrencyCode        : Currency;
  to_Booking          : Association to Booking;
  to_Travel           : Association to Travel;
  to_Supplement       : Association to Supplement;
};

_i18n/i18n.properties

BookingSupp-PriceErrorMessage = Please enter a price for booking supplement

  ```

### Localisation with contextual information

```
db/schema.cds

entity BookingSupplement : managed {
  key BookSupplUUID   : UUID;
  BookingSupplementID : Integer @Core.Computed;
  Price               : Decimal(16, 3) @mandatory @validation.message = 'i18n>BookingSupp-PriceErrorMessage';
  CurrencyCode        : Currency;
  to_Booking          : Association to Booking;
  to_Travel           : Association to Travel;
  to_Supplement       : Association to Supplement;
};

_i18n/i18n.properties
BookingSupp-PriceErrorMessage = Please enter a price for booking supplement {{BookingSupplement-BookingSupplementID}}, Booking: {{Booking-BookingID}}

   ```
## Custom Validations 
The introduced annotation @validation.handler allows a class to be specified that implements a custom validation. This allows for modulisation and resue of validations. Implementations must extend the BaseValidation class and implement the IsValid Method, returning true or false. CAPVAL will automatically determine the targets (in/to_Booking(BookingUUID etc etc), colate, and return the errors. 

### Example 
#### Custom Validation
```
srv/handlers/BeginDateChecks.js

const BaseValidation = require("capval");
module.exports = class BeginDateChecks extends BaseValidation {
  isValid(InputValue) {
    var travel = this.getNode();

    if (travel.BeginDate > travel.EndDate) {
      return false;
    }

    return true;
  }
};

db/validations.cds
annotate schema.Travel {
    @validation: {
        message: 'Please enter a begin date',
        handler: 'srv/handlers/BeginDateChecks.js'
    }
   BeginDate;
}

```

#### Advanced Scenario
A generic conditional validation with dynamic error messages

```
srv/handlers/BeginDateChecks.js

const BaseValidation = require('capval')
module.exports = class ConditionalMandatoryCheck extends BaseValidation {
    isValid(InputValue) {
       var data = this.getDataToRoot()

       if(data['Travel.TravelStatus_code'] === 'X') return false
        if(!InputValue) {
            this.seti18nMessage(this.getField()+ '-errorMessage')
            return false
        }
        return true
    }
}
_i18n/i18n.properties
BeginDate-errorMessage = Please enter a valid begin date
```
#### Custom Data Scenario
```
srv/handlers/BeginDateChecks.js

const BaseValidation = require('capval')
module.exports = class BeginDateChecks extends BaseValidation {
    isValid(InputValue) {
       var travel = this.getNode();
       var today =(new Date).toISOString().slice(0,10)
      
       if(travel.BeginDate < today) {
        this.seti18nMessage("begindatetoday-errorMessage")
        this.setCustomMessageVariables({ today: today})
        return false;
       }
      

        return true;
    }
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
6. getData(): Returns the full data(root with all ancestors) of of the instance

The following setter methods are available
1. setMessage(Message): Overwrites the Error Message. Variables in double curly brackets can be provided
2. seti18nMessage(Message): Overwrites the Error Message by providing a key for an entry in the i18n.properties file
3. setTaret(Target): Overwrites the generated field target
4. setCustomMessageVariables(data): Allows a JSON Object with custom key value pairs to be used in error messages





