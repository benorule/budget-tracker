let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(event) {
   // pending object store that contains transactions waiting to be added to database when online
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;

  // check network status
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Error " + event.target.errorCode);
};

// create, access and add to pending
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");

  const store = transaction.objectStore("pending");

  store.add(record);
}


// open, access and get from pending
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      // open, access and clear from pending
      .then(() => {
        const transaction = db.transaction(["pending"], "readwrite");

        const store = transaction.objectStore("pending");

        store.clear();
      });
    }
  };
}

// listener for network status
window.addEventListener("online", checkDatabase);
