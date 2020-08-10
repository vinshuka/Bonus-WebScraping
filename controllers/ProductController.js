const Product = require('../models/product');
const puppeteer = require('puppeteer');
const sleep = async time => new Promise(resolve => setTimeout(resolve, time * 1000));

exports.index = async (req, res) => {
    const products = await Product.find();

    res.render('products/index', {
        pageTitle: 'Products',
        products
    })
};

exports.update = async (req, res) => {
    const products = await scrapeIt('https://www.ikea.com/ca/en/cat/desks-for-home-20651/');

    for (let product of products) {
        if (product.title === "" || product.price === "") continue;
        await Product.updateOne({
            sku: product.sku
            },
            product,
            {
                upsert: true
            }
        );
    }

    res.redirect('/products');
};

async function scrapeIt (url) {
    const browser = await puppeteer.launch({headless: false});
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(url, ['geolocation']);

    //create our page context
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080
    });
    page.on('dialog', async dialog => await dialog.dismiss());
    page.on('console', msg => console.log(msg._text)); 
    await page.exposeFunction('sleep', sleep);

    await page.goto(url);
    await sleep(5);
    await page.screenshot({path: 'screenshots/check.png'});
    await page.evaluate(async () => {
        window.scrollBy(0, document.body.scrollHeight);
        await sleep(2);
    });

    await page.waitForSelector(`[class^="js-product-list"]`, {visible: true, timeout: 120});

    const content = await page.evaluate(async () => {
        const productScrape = document.querySelectorAll('.range-revamp-product-compact');
        const products = [];

        for (let product of productScrape) {
            if (!product.querySelector('img')) {
                product.scrollIntoView();
                await sleep(2);
            }

            const link = product.querySelector('a').href;
            const parts = link.split('-');
            const sku = parts[parts.length - 1];

            const title = product.querySelector(`[class^="range-revamp-header-section__title--small"]`).textContent;
            const price = product.querySelector(`[class^="range-revamp-price__integer"]`).textContent
            const image = product.querySelector('img').srcset;

            products.push({title, price, image, sku});
        }
        return products;
    });

    await browser.close();
    return content;
};