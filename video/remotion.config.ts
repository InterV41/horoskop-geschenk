import { Config } from '@remotion/cli/config';

// Bilder als PNG, damit feine Goldkörner nicht vom JPEG-Rauschen verschluckt werden
Config.setVideoImageFormat('png');
Config.setConcurrency(4);
