using my.bookshop as my from '../db/data-model';

service CatalogService {
    entity Books    as projection on my.Books;
    entity Chapters as projection on my.Chapters;
}
