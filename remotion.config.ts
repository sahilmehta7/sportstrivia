import { Config } from "@remotion/cli/config";
import { withVideoWebpackOverride } from "./video/webpack-override";

Config.overrideWebpackConfig((current) => withVideoWebpackOverride(current));

