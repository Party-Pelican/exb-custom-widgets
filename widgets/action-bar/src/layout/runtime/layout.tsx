/** @jsx jsx */
import { React, ReactRedux, classNames, jsx, css } from "jimu-core";
import { styleUtils, Button } from "jimu-ui";
import {
  utils,
  PageContext,
  PageContextProps,
  LayoutProps,
  StateToLayoutProps,
} from "jimu-layouts/layout-runtime";

interface LayoutEntryProps extends LayoutProps, StateToLayoutProps {}

export default function Layout(props: LayoutEntryProps) {
  console.log(props);
  return <div>Test</div>;
}
