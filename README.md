# Background
SAP CAPVAL is a SAP Cloud Application Programming Model(CAP) plugin that aims to improve and extend the standard validations provided

CAPVAL provides two key features:

1. Custom Messages: Work along side standard validation annonations and overwrite default error messages via the @validation.message annonation. Localisation is supported and dynamic contextual information can be provided.
  ##Examples
  ###Static Text
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
