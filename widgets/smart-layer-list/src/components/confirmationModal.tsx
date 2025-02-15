import { React } from "jimu-core";
import { CalciteButton, CalciteModal } from "calcite-components";
import { createPortal } from "react-dom";

type ConfirmationModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationModal({
  open,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return createPortal(
    <CalciteModal open={open} onCalciteModalClose={onCancel}>
      <h3 slot="header">Are you sure?</h3>
      <p slot="content">
        Clicking confirm will reset your layer list visibility to the default
        configuration.
      </p>

      <CalciteButton
        slot="back"
        kind="neutral"
        appearance="outline"
        onClick={onCancel}
      >
        Cancel
      </CalciteButton>
      <CalciteButton slot="primary" width="full" onClick={onConfirm}>
        Confirm
      </CalciteButton>
    </CalciteModal>,
    document.body
  );
}
