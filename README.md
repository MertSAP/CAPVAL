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
entity BookingSupplement : managed {
  key BookSupplUUID   : UUID;
  BookingSupplementID : Integer @Core.Computed;
  Price               : Decimal(16, 3) @mandatory @validation.message = 'i18n>BookingSupp-PriceErrorMessage';
  CurrencyCode        : Currency;
  to_Booking          : Association to Booking;
  to_Travel           : Association to Travel;
  to_Supplement       : Association to Supplement;
};

BookingSupp-PriceErrorMessage = Please enter a price for booking supplement

  ```

### Localisation with contextual information

```
entity BookingSupplement : managed {
  key BookSupplUUID   : UUID;
  BookingSupplementID : Integer @Core.Computed;
  Price               : Decimal(16, 3) @mandatory @validation.message = 'i18n>BookingSupp-PriceErrorMessage';
  CurrencyCode        : Currency;
  to_Booking          : Association to Booking;
  to_Travel           : Association to Travel;
  to_Supplement       : Association to Supplement;
};

BookingSupp-PriceErrorMessage = Please enter a price for booking supplement {{BookingSupplement-BookingSupplementID}}, Booking: {{Booking-BookingID}}

   ```
## Custom Validations 
The introduced annotation @validation.handler allows the developer to specify a class that implements the custom validation. This allows for modulisation and resue of validations. Implementations must extend the BaseValidation class and implement the IsValid Method, returning true or false. CAPVAL will automatically determine the targets (in/to_Booking(BookingUUID etc etc), colate, and return the errors. 

### Example Implementation
```
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

annotate schema.Travel {
    @validation: {
        message: 'Please enter a begin date',
        handler: 'srv/handlers/BeginDateChecks.js'
    }
   BeginDate;
}

```


