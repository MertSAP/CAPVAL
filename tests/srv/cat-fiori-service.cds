using my.bookshop as my from '../db/data-model';

service CatalogFioriService {
    @odata.draft.enabled
    entity Books as projection on my.Books;
}
