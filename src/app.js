const express = require("express");
const i18next = require("i18next");
const BackendI18Next = require("i18next-fs-backend");
const HttpMiddlewareI18Next = require("i18next-http-middleware");
const UserRouter = require("./user/user-router");
const ErrorHandler = require("./error/error-handler");

i18next
  .use(BackendI18Next)
  .use(HttpMiddlewareI18Next.LanguageDetector)
  .init({
    fallbackLng: "en",
    lng: "en",
    ns: ["translation"],
    defaultNS: "translation",
    backend: {
      loadPath: "./locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      lookupHeader: "accept-language",
    },
  });

const app = express();

app.use(HttpMiddlewareI18Next.handle(i18next));

app.use(express.json());

app.use(UserRouter);

app.use(ErrorHandler);

module.exports = app;
