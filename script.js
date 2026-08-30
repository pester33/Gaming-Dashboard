(function () {
  "use strict";

  var input = document.getElementById("linkSearch");
  var list = document.getElementById("linkList");
  var noResults = document.getElementById("noResults");
  if (!input || !list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll(".link-entry"));

  input.addEventListener("input", function () {
    var query = input.value.trim().toLowerCase();
    var visibleCount = 0;

    items.forEach(function (item) {
      var name = item.getAttribute("data-name") || "";
      var matches = name.indexOf(query) !== -1;
      item.hidden = !matches;
      if (matches) visibleCount++;
    });

    if (noResults) noResults.hidden = visibleCount !== 0;
  });
})();
