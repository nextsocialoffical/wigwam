import { FC } from "react";

import BaseProvider from "./BaseProvider";
import FullScreenRouter from "./FullScreenRouter";
import AddAccountModal from "./blocks/AddAccountModal";
import WarningModal from "./blocks/WarningModal";

const MainApp: FC = () => (
  <BaseProvider>
    <FullScreenRouter />

    <Modals />
  </BaseProvider>
);

export default MainApp;

const Modals: FC = () => {
  return (
    <>
      <WarningModal />
      <AddAccountModal />
    </>
  );
};
