import reactiveUtils from "@arcgis/core/core/reactiveUtils";
import LayerList from "@arcgis/core/widgets/LayerList";
import { React } from "jimu-core";
import { Button, Loading } from "jimu-ui";
import { useEffect, useState } from "react";
import ConfirmationModal from "./confirmationModal";

type ManagedbProps = {
  database: IDBDatabase;
  objectStoreName: string;
  llWidget: LayerList;
  saveColor: string;
  resetColor: string;
  textColor: string;
};

/**
 * Recursively gather the layer list items and store them in the provided array.
 */
async function gatherListItem(
  items: __esri.Collection<__esri.ListItem>,
  visArr: __esri.ListItem[]
) {
  for (const item of items) {
    if (item.updating) {
      await reactiveUtils.whenOnce(() => !item.updating);
      visArr.push(item);

      if (item.children.length > 0) {
        await gatherListItem(item.children, visArr);
      }
    } else {
      visArr.push(item);

      if (item.children.length > 0) {
        await gatherListItem(item.children, visArr);
      }
    }
  }
}

function handleError(err) {
  console.log(err);
}

export default function Managedb({
  database,
  objectStoreName,
  llWidget,
  saveColor,
  resetColor,
  textColor,
}: ManagedbProps) {
  const [disabled, setDisabled] = useState(false);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      console.log("Initializing Smart Layer List...");
      const layerListLayers: __esri.ListItem[] = [];

      await gatherListItem(llWidget.operationalItems, layerListLayers);

      const readTrans = database.transaction(objectStoreName, "readonly");
      const readObjectStore = readTrans.objectStore(objectStoreName);
      const dbCursor = readObjectStore.openCursor();
      let isEmpty = true;
      dbCursor.onsuccess = () => {
        const cursorResult = dbCursor.result;

        if (cursorResult) {
          console.table(cursorResult.value);
          // Update the visibility of each layer based on the configuration
          layerListLayers.find(
            (li) => li.layer.id === cursorResult.value.layerId
          ).visible = cursorResult.value.visible;
          cursorResult.continue();
          isEmpty = false;
        } else {
          if (isEmpty) {
            // If the database is empty, disable the reset button.
            setDisabled(true);
          }
        }
      };

      dbCursor.onerror = handleError;
    }

    initialize().then(() => setLoading(false));
  }, []);

  /**
   * Save the visibility of each layer in the Layer List widget to the database.
   */
  async function handleSave() {
    setLoading(true);
    const layerListLayers: __esri.ListItem[] = [];

    // Gather the layer list items and store them in the layerListLayers array
    await gatherListItem(llWidget.operationalItems, layerListLayers);

    const writeTrans = database.transaction(objectStoreName, "readwrite");
    const objectstore = writeTrans.objectStore(objectStoreName);

    // Save the visibility of each layer to the object store
    layerListLayers.forEach((li: __esri.ListItem) => {
      const putReq = objectstore.put({
        layerId: li.layer.id,
        title: li.title,
        visible: li.visible,
      });

      putReq.onsuccess = () => {
        console.log("Saving", putReq.result);
      };

      putReq.onerror = handleError;
    });

    setLoading(false);
  }

  /**
   * Clear the configuration of the Layer List widget from the database.
   */
  function handleReset() {
    setLoading(true);
    const transactionReq = database.transaction(objectStoreName, "readwrite");
    const objectstore = transactionReq.objectStore(objectStoreName);

    const clearReq = objectstore.clear();
    clearReq.onsuccess = function () {
      setLoading(false);
      console.log("Cleared everything");
    };

    setModal(false);
  }

  function promptReset() {
    setModal(true);
  }

  function handleModalCancel() {
    setModal(false);
  }

  return (
    <div className="container">
      <div className="row mx-auto">
        <Button
          type="primary"
          className="col py-2 m-2"
          onClick={handleSave}
          style={{
            backgroundColor: saveColor,
            color: textColor,
          }}
        >
          Save
        </Button>

        <Button
          type="danger"
          className="col py-2 m-2"
          style={{
            backgroundColor: resetColor,
            color: textColor,
          }}
          onClick={promptReset}
          disabled={disabled}
        >
          Reset
        </Button>
        {loading && <Loading type="BAR"></Loading>}
      </div>
      <ConfirmationModal
        open={modal}
        onConfirm={handleReset}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
