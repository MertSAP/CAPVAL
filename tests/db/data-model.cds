namespace my.bookshop;

entity Books {
  key ID           : UUID;
      title        : String;

      @validation.message: 'Enter a valid description'
      @assert.format     : '[a-z]+ [0-9]+'
      description  : String;

      @assert.range      : [
        0,
        10000
      ]
      @validation.message: 'Stock can not be more than 10,000'
      stock        : Integer;

      @assert.range      : [
        0,
        20
      ]
      @validation.message: 'Reorder Point: {{Books-reorderPoint}} not between 0 and 20'
      reorderPoint : Integer;

      @mandatory
      @validation.message: 'Release Date has to be to be set'
      releaseDate  : Date;

      @validation        : {
        message: 'i18n>previewDate',
        handler: 'srv/handlers/DateChecks.js'
      }
      previewDate  : Date;

      @mandatory
      @validation.message: 'i18n>price-error'
      price        : Integer;
      to_Chapters  : Composition of many Chapters
                       on to_Chapters.to_Books = $self
}

entity Chapters {
  key ID       : UUID;

      @mandatory
      @validation.message: 'Enter a valid chapter title'
      title    : String;
      to_Books : Association to Books
}
