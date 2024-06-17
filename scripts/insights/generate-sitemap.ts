import { writeFile } from 'fs';
import { slugify } from '../../src/lib/util/url/slugify.ts';
import { noIndex, essGeocodes } from '../../src/lib/config/geoConfig.ts';
import { create } from 'xmlbuilder2';

export function generateSitemap (areas, indicators) {


    const sitemapData = {
        'areas': areas.filter(d => !noIndex.includes(d.areacd.slice(0,3))),
        'areas-with-indicators': areas.filter(d => essGeocodes.includes(d.areacd.slice(0,3))),
        'indicators': indicators.map(d => d.slug)
    }

    const intro = `<?xml version="1.0" encoding="utf-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

    const outro = `</urlset>`

let paths:string[] = []

Object.keys(sitemapData).forEach(d => {
    if (d == "areas") {
        sitemapData[d].forEach( (e,i) => {
            paths.push("https://explore-local-statistics.beta.ons.gov.uk/areas/" + e.areacd + "-" + slugify(e.areanm))
        })
    } else if (d == "areas-with-indicators") {
        sitemapData[d].forEach( (e,i) => {
        paths.push("https://explore-local-statistics.beta.ons.gov.uk/areas/" + e.areacd + "-" + slugify(e.areanm) + "/indicators")
        })
    } else {
        sitemapData[d].forEach( (f) => {
            paths.push("https://explore-local-statistics.beta.ons.gov.uk/indicators/" + f)
        })
    }
})

paths.push("https://explore-local-statistics.beta.ons.gov.uk/")
paths.push("https://explore-local-statistics.beta.ons.gov.uk/areas/")
paths.push("https://explore-local-statistics.beta.ons.gov.uk/indicators/")

let content = intro;

let date = new Date().toISOString().split("T")[0]

paths.forEach( d => {
    content = content.concat("<url>",
        "<loc>", d, "</loc>",
        "<lastmod>", date, "</lastmod>",
      "</url>")
})

content = content.concat(outro)

let doc = create(content).end({ prettyPrint: true })


    // writeJson('./noIndex.json', noIndex);

    writeFile('./static/sitemap.xml', doc, err => {
        if (err) {
          console.error(err);
        } else {
          // file written successfully
        }
      });
}