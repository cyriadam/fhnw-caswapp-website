// console.log("Client side javascript is loaded");

// -- elements --
let $modalPopup;
let popupDiseabled = false;
const modalTemplate =
  "<div id='popup'><div id='popup-container'><span id='popup-close'>&times;</span><div id='popup-content'>${modalContent}</div></div></div>";

// usage : document.getElementById("button1").onclick = () => popup("<h2>Popup</h2><p>hello World1</p>");
const popup = (modalContent) => {
  if (popupDiseabled) return;
  if ($modalPopup === undefined) {
    let popup = eval("`" + modalTemplate + "`");
    document.body.insertAdjacentHTML("afterbegin", popup);
    $modalPopup = document.getElementById("popup");
    $modalPopup.style.display = "block";
    document.getElementById("popup-close").onclick = () => ($modalPopup.style.display = "none");
  } else {
    document.getElementById("popup-content").innerHTML = modalContent;
    $modalPopup.style.display = "block";
  }
  document.activeElement.blur(); // remove the focus on the active element
};
