import { IDdeStep1Config } from '@interfaces/common';

export const buildLoaderArgs = (config: IDdeStep1Config): string[] => {
  const args = [
    '--usdm_file',
    config.usdmPath,
    '--output_template',
    config.outputTemplatePath,
    '--sdtmct',
    config.sdtmct,
    '--sdtmig',
    config.sdtmig,
    '--studyversion',
    config.studyversion,
    '--studydesign',
    config.studydesign,
    '--docversion',
    config.docversion,
    '--cosmosversion',
    config.cosmosversion
  ];

  if (config.cdiscApiKey) {
    args.push('--cdisc_api_key', config.cdiscApiKey);
  }
  if (config.useCdiscLibraryProxy) {
    args.push('--base_api_url', 'http://localhost:4600/api');
  }
  if (config.validate) {
    args.push('--validate');
  }
  if (config.validationReportPath) {
    args.push('--validation_report', config.validationReportPath);
  }
  if (config.debug) {
    args.push('--debug');
  }
  if (config.noSslVerify) {
    args.push('--no_ssl_verify');
  }

  return args;
};
