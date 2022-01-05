/** Dataset object, as found in Elasticsearch index/search responses */
export interface EsDataset {
    variables: readonly string[];
    citation: unknown;
    year: unknown;
    allowed_principals: readonly unknown[];
    time_domain: string;
    description: string;
    spatial_domain: string;
    type: string;
    title: string;
    message: string;
    resolution: string;
    gcm: unknown;
    external_url: string;
    domain: string;
    emsc: unknown;
    scientific_type: readonly string[];
    status: "SUCCESS" | "IMPORTING" | "FAILED" | "CREATED";
    uuid: string;
}

//TO DO: Knowledge network dataset
// export interface EsDatasetKN {
//     accessControl: null,
//     accessNotes: null,
//     accrualPeriodicity: {
//         text: string
//     },
//     accrualPeriodicityRecurrenceRule: null,
//     catalog: "Geoscience Australia",
//     contactPoint: {
//         identifier: "Commonwealth of Australia (Geoscience Australia), clientservices@ga.gov.au"
//     },
//     description: "The radiometric, or gamma-ray spectrometric method, measures the natural variations in the gamma-rays detected near the Earth's surface as the result of the natural radioactive decay of potassium (K), uranium (U) and thorium (Th). The data collected are processed via standard methods to ensure the response recorded is that due only to the rocks in the ground. The results produce datasets that can be interpreted to reveal the geological structure of the sub-surface. The processed data is checked for quality by GA geophysicists to ensure that the final data released by GA are fit-for-purpose.\r\nThis radiometric thorium grid has a cell size of 0.00083 degrees (approximately 85m) and shows thorium element concentration of the Dumbleyung (SWCC), WA, 2008 in units of parts per million (or ppm). The data used to produce this grid was acquired in 2008 by the WA Government, and consisted of 75805 line-kilometres of data at a line spacing between 100m and 400m, and 60m terrain clearance.",
//     distributions: [{
//         accessURL: "https://portal.ga.gov.au/persona/gadds",
//         description: "The Geophysical Archive Data Delivery System (GADDS2) portal provides HTTP download of geophysics datasets in a number of formats. Point and line datasets are available in NetCDF and ASEG-GDF2. Grid datasets are available in NetCDF, GeoTIFF and ERS.",
//         format: "HTML",
//         identifier: "dist-ga-5ac889ba-e070-4af9-adcc-77df995b078a-0",
//         license: {
//             name: "Creative Commons Attribution 4.0 International Licence"
//         },
//         source: {
//             id: "ga",
//             name: "Geoscience Australia",
//             url: "https://ecat.ga.gov.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&id=5ac889ba-e070-4af9-adcc-77df995b078a"
//         },
//         title: "File available for download in various formats from the GADDS2 portal"
//     }, {
//         accessURL: "https://dapds00.nci.org.au/thredds/fileServer/iv65/Geoscience_Australia_Geophysics_Reference_Data_Collection/airborne_geophysics/WA/grid/P1177/P1177-grid-th_conc-Katanning.nc",
//         description: "File download for GSWA P1177 Katanning ppmth grid geodetic",
//         format: "X-NETCDF",
//         identifier: "dist-ga-5ac889ba-e070-4af9-adcc-77df995b078a-1",
//         license: {
//             name: "Creative Commons Attribution 4.0 International Licence"
//         },
//         source: {
//             id: "ga",
//             name: "Geoscience Australia",
//             url: "https://ecat.ga.gov.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&id=5ac889ba-e070-4af9-adcc-77df995b078a"
//         },
//         title: "GSWA P1177 Katanning ppmth grid geodetic file download"
//     }, {
//         accessURL: "https://dapds00.nci.org.au/thredds/ncss/grid/iv65/Geoscience_Australia_Geophysics_Reference_Data_Collection/airborne_geophysics/WA/grid/P1177/P1177-grid-th_conc-Katanning.nc/dataset.html",
//         description: "NetCDF Subsetting Service (NCSS) for GSWA P1177 Katanning ppmth grid geodetic",
//         format: "HTML",
//         identifier: "dist-ga-5ac889ba-e070-4af9-adcc-77df995b078a-2",
//         license: {
//             name: "Creative Commons Attribution 4.0 International Licence"
//         },
//         source: {
//             id: "ga",
//             name: "Geoscience Australia",
//             url: "https://ecat.ga.gov.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&id=5ac889ba-e070-4af9-adcc-77df995b078a"
//         },
//         title: "GSWA P1177 Katanning ppmth grid geodetic NCSS"
//     }, {
//         accessURL: "https://dapds00.nci.org.au/thredds/dodsC/iv65/Geoscience_Australia_Geophysics_Reference_Data_Collection/airborne_geophysics/WA/grid/P1177/P1177-grid-th_conc-Katanning.nc.html",
//         description: "OPeNDAP web service for GSWA P1177 Katanning ppmth grid geodetic",
//         format: "HTML",
//         identifier: "dist-ga-5ac889ba-e070-4af9-adcc-77df995b078a-3",
//         license: {
//             name: "Creative Commons Attribution 4.0 International Licence"
//         },
//         source: {
//             id: "ga",
//             name: "Geoscience Australia",
//             url: "https://ecat.ga.gov.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&id=5ac889ba-e070-4af9-adcc-77df995b078a"
//         },
//         title: "GSWA P1177 Katanning ppmth grid geodetic OPeNDAP"
//     }, {
//         accessURL: "https://dapds00.nci.org.au/thredds/wms/iv65/Geoscience_Australia_Geophysics_Reference_Data_Collection/airborne_geophysics/WA/grid/P1177/P1177-grid-th_conc-Katanning.nc?service=WMS&version=1.3.0&request=GetCapabilities",
//         description: "OGC Web Mapping Service (WMS) for GSWA P1177 Katanning ppmth grid geodetic",
//         format: "WMS",
//         identifier: "dist-ga-5ac889ba-e070-4af9-adcc-77df995b078a-4",
//         license: {
//             name: "Creative Commons Attribution 4.0 International Licence"
//         },
//         source: {
//             id: "ga",
//             name: "Geoscience Australia",
//             url: "https://ecat.ga.gov.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&id=5ac889ba-e070-4af9-adcc-77df995b078a"
//         },
//         title: "GSWA P1177 Katanning ppmth grid geodetic WMS"
//     }, {
//         accessURL: "https://dapds00.nci.org.au/thredds/wcs/iv65/Geoscience_Australia_Geophysics_Reference_Data_Collection/airborne_geophysics/WA/grid/P1177/P1177-grid-th_conc-Katanning.nc?service=WCS&version=1.0.0&request=GetCapabilities",
//         description: "OGC Web Coverage Service (WCS) for GSWA P1177 Katanning ppmth grid geodetic",
//         format: "OGC:WCS",
//         identifier: "dist-ga-5ac889ba-e070-4af9-adcc-77df995b078a-5",
//         license: {
//             name: "Creative Commons Attribution 4.0 International Licence"
//         },
//         source: {
//             id: "ga",
//             name: "Geoscience Australia",
//             url: "https://ecat.ga.gov.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&id=5ac889ba-e070-4af9-adcc-77df995b078a"
//         },
//         title: "GSWA P1177 Katanning ppmth grid geodetic WCS"
//     }],
//     hasQuality: false,
//     identifier: "ds-ga-5ac889ba-e070-4af9-adcc-77df995b078a",
//     indexed: "2021-12-13T06:35:26.200Z",
//     issued: "2020-03-07T00:00+10:00",
//     keywords: ["EARTH SCIENCES", "NCI", "Earth sciences", "geophysics", "grid", "Australia", "WA", "survey 1177", "GADDS2.0", "radiometrics", "NASVD", "thorium", "airborne digital data", "geophysical survey", "rad", "Th", "gamma-ray", "spectrometry", "grid", "raster", "Published_External"],
//     landingPage: null,
//     languages: [],
//     modified: "2021-07-06T01:18:36+10:00",
//     provenance: null,
//     publisher: {
//         acronym: ["GA"],
//         addrSuburb: "Canberra",
//         aggKeywords: "geoscience australia",
//         identifier: "org-ga-Geoscience Australia",
//         name: "Geoscience Australia",
//         source: {
//             id: "ga",
//             name: "Geoscience Australia",
//             url: "https://ecat.ga.gov.au/geonetwork/srv/eng/csw"
//         }
//     },
//     publishingState: "published",
//     quality: 1,
//     score: null,
//     source: {
//         id: "ga",
//         name: "Geoscience Australia",
//         url: "https://ecat.ga.gov.au/geonetwork/srv/eng/csw?service=CSW&version=2.0.2&request=GetRecordById&elementsetname=full&outputschema=http%3A%2F%2Fwww.isotc211.org%2F2005%2Fgmd&typeNames=gmd%3AMD_Metadata&id=5ac889ba-e070-4af9-adcc-77df995b078a"
//     },
//     spatial: {
//         geoJson: {
//             coordinates: [
//                 [
//                     [117.4873, -34.0111],
//                     [118.0122, -34.0111],
//                     [118.0122, -33.6261],
//                     [117.4873, -33.6261],
//                     [117.4873, -34.0111]
//                 ]
//             ],
//             type: "Polygon"
//         },
//         text: "POLYGON((117.4873 -34.0111, 118.0122 -34.0111, 118.0122 -33.6261, 117.4873 -33.6261, 117.4873 -34.0111))"
//     },
//     temporal: {
//         end: {
//             date: "2008-11-08T00:00+10:00",
//             text: "2008-11-08T00:00:00"
//         },
//         start: {
//             date: "2008-03-01T00:00+10:00",
//             text: "2008-03-01T00:00:00"
//         }
//     },
//     tenantId: 0,
//     themes: ["geoscientificInformation"],
//     title: "GSWA P1177 Katanning ppmth grid geodetic",
//     years: "2008-2008"
// }