import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

const express = require('express');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { CdiscLibrary } = require('cla-wrapper');

export type ClaMirrorConfig = {
  auth: {
    apiKey: string;
  };
  port: number;
  debug: boolean;
  cache: {
    enabled: boolean;
    includeFilter: string[];
    excludeFilter: string[];
    cacheFolder: string;
  };
  cors: {
    enabled: boolean;
    origins: string[];
  };
  https?: {
    enabled: boolean;
    privateKeyPath?: string;
    certificatePath?: string;
  };
  ct: {
    useNciSiteForCt: boolean;
    nciSiteUrl: string;
    enableNciProxy: boolean;
  };
  rateLimit?: {
    enabled: boolean;
    windowMs: number;
    max: number;
  };
};

const DEFAULT_EXCLUDE_FILTER = [
  'health',
  'mdr/lastupdated',
  'mdr/products',
  '.*/root/.*',
  'mdr/search/.*'
];

const DEFAULT_CORS_ORIGINS = ['*'];

const wrapperRequest = async (params: string, cdiscLibrary: any) => {
  const queryString = require('query-string');
  const paramsParsed = queryString.parse(params);
  let {
    format,
    traffic,
    productList,
    product,
    productDetails,
    itemGroup,
    listItemGroups
  } = paramsParsed;

  if (!format) {
    format = 'json';
  }

  if (traffic !== undefined) {
    return cdiscLibrary.getTrafficStats();
  }

  if (productList !== undefined) {
    return cdiscLibrary.getProductList(format);
  }

  if (productDetails !== undefined) {
    return cdiscLibrary.getProductDetails({ type: 'long', format });
  }

  if (product) {
    const prodId = await cdiscLibrary.getProductIdByAlias(product);
    if (!prodId) {
      return `No such product (${product}). See /?productList or /?productDetails for the full list of products.`;
    }

    const prd = await cdiscLibrary.getFullProduct(product, true);

    if (listItemGroups !== undefined) {
      return prd.getItemGroups({ type: 'short', format });
    }

    if (itemGroup) {
      const dataset = await prd.getItemGroup(itemGroup);
      if (dataset !== undefined) {
        return dataset.getFormattedItems(format);
      }

      return `No such itemGroup (${itemGroup}). See /?product=XXX&listItemGroups to get the full list of itemGroups.`;
    }
  }

  return undefined;
};

class ClaCache {
  private cacheFolder: string;

  private cachedIds: string[];

  private excludeFilter: string[];

  private includeFilter: string[];

  constructor({
    cacheFolder,
    cachedIds = [],
    excludeFilter = [],
    includeFilter = []
  }: {
    cacheFolder: string;
    cachedIds?: string[];
    excludeFilter?: string[];
    includeFilter?: string[];
  }) {
    this.cacheFolder = cacheFolder;
    this.cachedIds = cachedIds;
    this.excludeFilter = excludeFilter;
    this.includeFilter = includeFilter;
    this.init = this.init.bind(this);
    this.getRequestId = this.getRequestId.bind(this);
    this.filterRequest = this.filterRequest.bind(this);
    this.claMatch = this.claMatch.bind(this);
    this.claPut = this.claPut.bind(this);
  }

  async init() {
    try {
      await fs.mkdir(this.cacheFolder, { recursive: true });
    } catch (error) {
      // Ignore if the directory already exists.
    }

    let files: string[] = [];
    try {
      files = await fs.readdir(this.cacheFolder);
    } catch (_error) {
      return;
    }

    this.cachedIds = files.map((file) => file.replace(/\.gz$/, ''));
  }

  getRequestId(request: any) {
    const shortenedUrl = request.url
      .replace(/^.*?api\//, '')
      .replace(/^.*?ftp1\/CDISC\//, '')
      .replace('/root/', '/r/')
      .replace('/cdash/', '/cd/')
      .replace('/cdashig/', '/cdi/')
      .replace('/sdtm/', '/s/')
      .replace('/sdtmig/', '/si/')
      .replace('/send/', '/se/')
      .replace('/sendig/', '/sei/')
      .replace('/adam/', '/a/')
      .replace('/datasets/', '/d/')
      .replace('/domains/', '/dm/')
      .replace('/datastructures/', '/ds/')
      .replace('/classes/', '/c/')
      .replace('/variables/', '/v/')
      .replace('/fields/', '/f/')
      .replace('/varsets/', '/vs/')
      .replace('/packages/', '/p/')
      .replace('/codelists/', '/cl/')
      .replace('/terms/', '/t/')
      .replace('/scenarios/', '/s/')
      .replace(/.*?\/mdr\//, '')
      .replace(/\//g, '.')
      .replace(/\s/g, '_');

    if (request && request.headers) {
      if (request.headers.Accept === 'application/json') {
        return shortenedUrl;
      }
      if (request.headers.Accept === 'application/text/csv') {
        return `${shortenedUrl}.csv`;
      }
      if (request.headers.Accept === 'application/vnd.ms-excel') {
        return `${shortenedUrl}.excel`;
      }
      if (request.headers.Accept === 'text/html') {
        return `${shortenedUrl}.html`;
      }
      if (request.headers.Accept === 'text/xml') {
        return `${shortenedUrl}.xml`;
      }
      return undefined;
    }

    return undefined;
  }

  filterRequest(request: any) {
    if (this.includeFilter.length > 0 || this.excludeFilter.length > 0) {
      const endpoint = request.url.replace(/^.*?api\//, '');
      const excludeMatched = this.excludeFilter.some((regex) =>
        RegExp(`^${regex}$`).test(endpoint)
      );
      if (excludeMatched) {
        return true;
      }

      if (this.includeFilter.length > 0) {
        const includeMatched = this.includeFilter.some((regex) =>
          RegExp(`^${regex}$`).test(endpoint)
        );
        if (!includeMatched) {
          return true;
        }
      }
    }

    return false;
  }

  async claMatch(request: any) {
    if (this.filterRequest(request)) {
      return undefined;
    }

    const id = this.getRequestId(request);
    if (id === undefined) {
      return undefined;
    }

    if (!this.cachedIds.includes(id)) {
      return undefined;
    }

    const zippedData = await fs.readFile(
      path.join(this.cacheFolder, `${id}.gz`)
    );
    const Jszip = require('jszip');
    const zip = new Jszip();
    await zip.loadAsync(zippedData);

    if (Object.keys(zip.files).includes('response.json')) {
      const result = await zip.file('response.json').async('string');
      return JSON.parse(result);
    }

    return undefined;
  }

  async claPut(request: any, response: any) {
    if (this.filterRequest(request)) {
      return;
    }

    const id = await this.getRequestId(request);
    if (!id) {
      return;
    }

    const data: { headers: any; body?: string } = { headers: response.headers };
    if (data.headers['content-type']?.startsWith('application/json')) {
      data.body = JSON.stringify(JSON.parse(response.body));
    } else {
      data.body = response.body;
    }

    const Jszip = require('jszip');
    const zip = new Jszip();
    zip.file('response.json', JSON.stringify(data));
    const zippedData = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 7 }
    });

    await fs.writeFile(path.join(this.cacheFolder, `${id}.gz`), zippedData);
    this.cachedIds.push(id);
  }
}

export const buildClaMirrorConfig = (
  userDataDir: string,
  apiKey = process.env.CDISC_API_KEY || ''
): ClaMirrorConfig => {
  const cacheFolder = path.join(userDataDir, 'cdiscCache');

  return {
    auth: {
      apiKey
    },
    port: 4600,
    debug: false,
    cache: {
      enabled: true,
      includeFilter: [],
      excludeFilter: DEFAULT_EXCLUDE_FILTER,
      cacheFolder
    },
    cors: {
      enabled: false,
      origins: DEFAULT_CORS_ORIGINS
    },
    ct: {
      useNciSiteForCt: false,
      nciSiteUrl: 'https://evs.nci.nih.gov/ftp1/CDISC',
      enableNciProxy: false
    },
    rateLimit: {
      enabled: false,
      windowMs: 60000,
      max: 60
    }
  };
};

class ClaMirrorManager {
  private appDataDir: string;

  private config: ClaMirrorConfig | null;

  private server: any;

  constructor(appDataDir = app.getPath('userData')) {
    this.appDataDir = appDataDir;
    this.config = null;
    this.server = null;
  }

  private getConfig(apiKeyOverride?: string): ClaMirrorConfig {
    const apiKey = apiKeyOverride || process.env.CDISC_API_KEY || '';
    if (!this.config || this.config.auth.apiKey !== apiKey) {
      this.config = buildClaMirrorConfig(this.appDataDir, apiKey);
    }
    return this.config;
  }

  public async start(apiKeyOverride?: string): Promise<any> {
    if (this.server) {
      return this.server;
    }

    const config = this.getConfig(
      apiKeyOverride || process.env.CDISC_API_KEY || ''
    );
    const cacheEnabled = config.cache && config.cache.enabled;
    const cacheDir =
      config.cache.cacheFolder || path.join(this.appDataDir, 'cdiscCache');
    await fs.mkdir(cacheDir, { recursive: true });
    const expressApp = express();

    expressApp.use((req: any, res: any, next: any) => {
      const remoteAddress = req.socket?.remoteAddress || req.ip || '';
      const isLocalhost =
        remoteAddress === '::1' ||
        remoteAddress === '::ffff:127.0.0.1' ||
        remoteAddress === '127.0.0.1' ||
        remoteAddress.startsWith('127.') ||
        remoteAddress.startsWith('::ffff:127.');

      if (!isLocalhost) {
        res.status(403).send('Forbidden: localhost only');
        return;
      }

      next();
    });

    if (cacheEnabled) {
      const claCache = new ClaCache({
        cacheFolder: cacheDir,
        excludeFilter: config.cache.excludeFilter,
        includeFilter: config.cache.includeFilter
      });
      await claCache.init();

      const cl = new CdiscLibrary({
        apiKey: config.auth.apiKey,
        useNciSiteForCt: config.ct.useNciSiteForCt,
        nciSiteUrl: config.ct.nciSiteUrl,
        cache: {
          match: (request: any) => claCache.claMatch(request),
          put: (request: any, response: any) =>
            claCache.claPut(request, response)
        }
      });

      expressApp.use(
        compression({
          filter: (req: any, res: any) => {
            if (req.headers['x-no-compression']) {
              return false;
            }
            if (typeof req.headers['accept-encoding'] === 'string') {
              return req.headers['accept-encoding']
                .split(',')
                .map((item: string) => item.trim())
                .includes('gzip')
                ? compression.filter(req, res)
                : false;
            }
            return false;
          }
        })
      );

      if (config.rateLimit && config.rateLimit.enabled) {
        const rateLimitConfig = {
          ...config.rateLimit,
          enabled: undefined,
          message:
            'You have reached the number of allowed requests. Please wait.'
        };
        expressApp.use(rateLimit(rateLimitConfig));
      }

      if (config.cors && config.cors.enabled) {
        const { origins } = config.cors;
        let corsOptions: any;
        if (
          !(
            Array.isArray(origins) &&
            origins.length === 1 &&
            origins[0] === '*'
          )
        ) {
          corsOptions = {
            origin: (origin: string | undefined, callback: any) => {
              if (origins.includes(origin || '')) {
                callback(null, true);
              } else {
                callback(new Error('Not allowed by CORS'));
              }
            }
          };
        }
        expressApp.use(cors(corsOptions));
      }

      expressApp.use('/', async (req: any, res: any) => {
        try {
          if (req.url.startsWith('/api/')) {
            const endpoint = req.url.replace(/^\/api/, '');
            const headers: Record<string, string> = {};

            if (
              /application\/(json|vnd\.ms-excel)|text\/csv/i.test(
                req.headers.accept
              )
            ) {
              headers.Accept = req.headers.accept;
            } else if (/&format=csv/i.test(endpoint)) {
              const nextEndpoint = endpoint.replace(/&format=csv/i, '');
              headers.Accept = 'text/csv';
              req.url = `/api${nextEndpoint}`;
            } else if (/&format=xls/i.test(endpoint)) {
              const nextEndpoint = endpoint.replace(/&format=xls/i, '');
              headers.Accept = 'application/vnd.ms-excel';
              req.url = `/api${nextEndpoint}`;
            } else if (/&format=json/i.test(endpoint)) {
              const nextEndpoint = endpoint.replace(/&format=json/i, '');
              req.url = `/api${nextEndpoint}`;
            }

            if (!config.auth.apiKey && req.headers['api-key']) {
              headers['api-key'] = req.headers['api-key'];
            }

            const response = await cl.coreObject.apiRequest(endpoint, {
              headers,
              returnRaw: true
            });

            if (
              response.statusCode !== 200 &&
              response.statusCode !== undefined
            ) {
              res.sendStatus(response.statusCode);
              return;
            }

            if (
              response.headers['content-type'] === 'application/vnd.ms-excel'
            ) {
              const fileName = `${endpoint
                .replace(/.*\/(.+\/.+)/, '$1')
                .replace(/\W/g, '.')}.xls`;
              res.setHeader(
                'Content-Disposition',
                `attachment; filename=${fileName}`
              );
              res.setHeader('Content-Type', response.headers['content-type']);
              res.setHeader(
                'Transfer-Encoding',
                response.headers['transfer-encoding']
              );
              res.send(Buffer.from(response.body, 'binary'));
              return;
            }

            res.setHeader('Content-Type', response.headers['content-type']);
            res.send(response.body);
            return;
          }

          if (req.url.startsWith('/?')) {
            const response = await wrapperRequest(
              req.url.replace(/^\//, ''),
              cl
            );
            res.send(response && response.body ? response.body : response);
            return;
          }

          if (req.url.startsWith('/nciSite/') && config.ct.enableNciProxy) {
            const acceptType = req.url.endsWith('.xml')
              ? 'text/xml'
              : 'text/html';
            const response = await cl.coreObject.apiRequest(req.url, {
              headers: { Accept: acceptType },
              returnRaw: true
            });
            res.send(response.body);
            return;
          }

          res.status(404).send('Not found');
        } catch (error: any) {
          console.log(
            `Error when running a request for ${req.url}: ${error.message}`
          );
          res.status(500).send('Internal Server Error');
        }
      });
    }

    const port = config.port || 4600;
    this.server = expressApp.listen(port, '127.0.0.1', () => {
      console.log(
        `CDISC Library API Mirror is listening on 127.0.0.1:${port} using HTTP protocol`
      );
    });

    return this.server;
  }

  public stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

export default ClaMirrorManager;
