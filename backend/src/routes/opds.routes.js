"use strict";

const express = require("express");
const router = express.Router();
const opdsController = require("../controllers/opds.controller");

// OPDS 2.0 Open Publication Catalog Routes
router.get("/v2/catalog", opdsController.getOPDSRootCatalog);
router.get("/v2/catalog.xml", opdsController.getOPDSRootCatalogXML);
router.get("/v2/publications", opdsController.getOPDSPublications);
router.get("/v2/search", opdsController.getOPDSSearch);

module.exports = router;
