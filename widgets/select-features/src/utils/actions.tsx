import ActionButton from "@arcgis/core/support/actions/ActionButton.js";

const bufferFromFeatureAction = new ActionButton({
  title: "Buffer",
  id: "buffer-this",
  icon: "rings",
});

export { bufferFromFeatureAction };
