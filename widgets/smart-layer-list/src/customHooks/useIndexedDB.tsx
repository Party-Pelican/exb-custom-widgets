import { React } from "jimu-core";
import { useEffect, useState } from "react";

export default function useIndexedDB(
  databaseName: string,
  objectStoreName: string
) {
  const [database, setDatabase] = useState<IDBDatabase | null>(null);

  // Open the database using the given name and version
  // UseEffect will run this function when dependencies change
  // databaseName and objectStoreName are dependencies
  useEffect(() => {
    // Function to open the database
    const openDatabase = () => {
      // Create a request to open the database
      const request = indexedDB.open(databaseName, 1);

      // If the request is successful, set the database state
      request.onsuccess = () => setDatabase(request.result);

      // If the database needs to be upgraded, create an object store
      request.onupgradeneeded = () => {
        const db = request.result;
        const store = db.createObjectStore(objectStoreName, {
          keyPath: "layerId",
        });
      };

      // If there's an error, log it to the console
      request.onerror = (err) => {
        console.log("Something went wrong opening the database", err);
      };
    };

    // Call the openDatabase function
    openDatabase();
  }, [databaseName, objectStoreName]);

  return { database };
}
