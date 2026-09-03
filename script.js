(function () {
  "use strict";

  var SUPABASE_URL = "https://rkzbbudlslekhxptfgdh.supabase.co";
  var SUPABASE_KEY = "sb_publishable_5acEu_aNb8oTa3gNmZLKtw_vbYhdUk_";
  var client = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  var currentUser = null;
  var currentThreadId = null;

  var linkInput = document.getElementById("linkSearch");
  var linkList = document.getElementById("linkList");
  var noResults = document.getElementById("noResults");

  var authModal = document.getElementById("authModal");
  var showLoginBtn = document.getElementById("showLoginBtn");
  var showRegisterBtn = document.getElementById("showRegisterBtn");
  var closeAuthModal = document.getElementById("closeAuthModal");
  var tabLoginBtn = document.getElementById("tabLoginBtn");
  var tabRegisterBtn = document.getElementById("tabRegisterBtn");
  var loginForm = document.getElementById("loginForm");
  var registerForm = document.getElementById("registerForm");
  var loginError = document.getElementById("loginError");
  var regError = document.getElementById("regError");
  var navLoggedOut = document.getElementById("navLoggedOut");
  var navLoggedIn = document.getElementById("navLoggedIn");
  var currentUsernameEl = document.getElementById("currentUsername");
  var logoutBtn = document.getElementById("logoutBtn");

  var toggleWikiFormBtn = document.getElementById("toggleWikiFormBtn");
  var wikiFormBox = document.getElementById("wikiFormBox");
  var wikiForm = document.getElementById("wikiForm");
  var cancelWikiBtn = document.getElementById("cancelWikiBtn");
  var wikiGrid = document.getElementById("wikiGrid");

  var toggleThreadFormBtn = document.getElementById("toggleThreadFormBtn");
  var threadFormBox = document.getElementById("threadFormBox");
  var threadForm = document.getElementById("threadForm");
  var cancelThreadBtn = document.getElementById("cancelThreadBtn");
  var forumThreadListContainer = document.getElementById("forumThreadListContainer");
  var threadTableBody = document.getElementById("threadTableBody");
  var threadViewer = document.getElementById("threadViewer");
  var backToThreadsBtn = document.getElementById("backToThreadsBtn");
  var viewThreadTitle = document.getElementById("viewThreadTitle");
  var threadPostsContainer = document.getElementById("threadPostsContainer");
  var replyForm = document.getElementById("replyForm");

  function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, function (tag) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      }[tag] || tag;
    });
  }

  async function uploadImageFile(fileInput) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return null;
    }
    var file = fileInput.files[0];
    var cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "");
    var filePath = Date.now() + "_" + cleanFileName;

    var uploadRes = await client.storage.from("uploads").upload(filePath, file);
    if (uploadRes.error) {
      alert("Failed to upload image: " + uploadRes.error.message);
      return null;
    }

    var urlData = client.storage.from("uploads").getPublicUrl(filePath);
    return urlData.data.publicUrl;
  }

  if (linkInput && linkList) {
    var items = Array.prototype.slice.call(linkList.querySelectorAll(".link-entry"));
    linkInput.addEventListener("input", function () {
      var query = linkInput.value.trim().toLowerCase();
      var visibleCount = 0;
      items.forEach(function (item) {
        var name = item.getAttribute("data-name") || "";
        var matches = name.indexOf(query) !== -1;
        item.hidden = !matches;
        if (matches) visibleCount++;
      });
      if (noResults) noResults.hidden = visibleCount !== 0;
    });
  }

  function updateAuthUI(user) {
    currentUser = user;
    var adminPanelEl = document.getElementById("adminPanel");

    if (user) {
      var name = user.user_metadata && user.user_metadata.display_name ? user.user_metadata.display_name : "User";
      currentUsernameEl.textContent = name;
      navLoggedIn.hidden = false;
      navLoggedOut.hidden = true;
      authModal.style.display = "none";

      if (name.toLowerCase() === "pester") {
        if (adminPanelEl) adminPanelEl.style.display = "block";
      } else {
        if (adminPanelEl) adminPanelEl.style.display = "none";
      }
    } else {
      navLoggedIn.hidden = true;
      navLoggedOut.hidden = false;
      if (adminPanelEl) adminPanelEl.style.display = "none";
    }
  }

  if (client) {
    client.auth.getSession().then(function (res) {
      if (res.data && res.data.session) {
        updateAuthUI(res.data.session.user);
      } else {
        updateAuthUI(null);
      }
    });

    client.auth.onAuthStateChange(function (event, session) {
      updateAuthUI(session ? session.user : null);
    });
  }

  function openAuthModal(mode) {
    authModal.style.display = "flex";
    loginError.hidden = true;
    regError.hidden = true;
    if (mode === "register") {
      tabRegisterBtn.classList.add("active");
      tabLoginBtn.classList.remove("active");
      registerForm.hidden = false;
      loginForm.hidden = true;
    } else {
      tabLoginBtn.classList.add("active");
      tabRegisterBtn.classList.remove("active");
      loginForm.hidden = false;
      registerForm.hidden = true;
    }
  }

  showLoginBtn.addEventListener("click", function () { openAuthModal("login"); });
  showRegisterBtn.addEventListener("click", function () { openAuthModal("register"); });
  
  closeAuthModal.addEventListener("click", function () { 
    authModal.style.display = "none"; 
  });
  
  authModal.addEventListener("click", function (e) {
    if (e.target === authModal) {
      authModal.style.display = "none";
    }
  });

  tabLoginBtn.addEventListener("click", function () { openAuthModal("login"); });
  tabRegisterBtn.addEventListener("click", function () { openAuthModal("register"); });

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    loginError.hidden = true;
    var username = document.getElementById("loginUsername").value.trim().toLowerCase();
    var password = document.getElementById("loginPassword").value;
    var email = username + "@gddash.local"; 

    var res = await client.auth.signInWithPassword({ email: email, password: password });
    if (res.error) {
      loginError.textContent = res.error.message;
      loginError.hidden = false;
    } else {
      authModal.style.display = "none";
      loginForm.reset();
    }
  });

  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    regError.hidden = true;
    var rawUsername = document.getElementById("regUsername").value.trim();
    var username = rawUsername.toLowerCase();
    var password = document.getElementById("regPassword").value;
    var email = username + "@gddash.local";

    var res = await client.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { display_name: rawUsername }
      }
    });

    if (res.error) {
      regError.textContent = res.error.message;
      regError.hidden = false;
    } else {
      alert("Registration successful! You are now logged in.");
      authModal.style.display = "none";
      registerForm.reset();
    }
  });

  logoutBtn.addEventListener("click", async function () {
    await client.auth.signOut();
  });

  toggleWikiFormBtn.addEventListener("click", function () {
    if (!currentUser) {
      openAuthModal("login");
      alert("Please log in to create a wiki entry.");
      return;
    }
    wikiFormBox.hidden = !wikiFormBox.hidden;
  });

  cancelWikiBtn.addEventListener("click", function () {
    wikiFormBox.hidden = true;
    wikiForm.reset();
  });

  wikiForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!currentUser) return;

    var title = document.getElementById("wikiTitle").value.trim();
    var url = document.getElementById("wikiUrl").value.trim();
    var desc = document.getElementById("wikiDescription").value.trim();
    var imgInput = document.getElementById("wikiImage");
    var author = currentUser.user_metadata.display_name || "User";

    var uploadedImgUrl = await uploadImageFile(imgInput);

    var res = await client.from("wikis").insert([{
      title: title,
      external_url: url || null,
      description: desc,
      image_url: uploadedImgUrl,
      user_id: currentUser.id,
      author_name: author
    }]);

    if (res.error) {
      alert("Error saving wiki: " + res.error.message);
    } else {
      wikiForm.reset();
      wikiFormBox.hidden = true;
      loadWikis();
    }
  });

  async function loadWikis() {
    if (!client) return;
    var res = await client.from("wikis").select("*").order("created_at", { ascending: false });
    if (res.error) {
      wikiGrid.innerHTML = '<p class="status-msg">Failed to load wikis.</p>';
      return;
    }

    if (!res.data || res.data.length === 0) {
      wikiGrid.innerHTML = '<p class="status-msg">No wikis created yet. Click "+ Create Your Wiki" to make the first one!</p>';
      return;
    }

    wikiGrid.innerHTML = "";
    res.data.forEach(function (w) {
      var card = document.createElement("div");
      card.className = "wiki-card";
      var dateStr = new Date(w.created_at).toLocaleDateString();
      var extLink = w.external_url ? '<a class="wiki-ext-link" href="' + escapeHTML(w.external_url) + '" target="_blank" rel="noopener">Visit External Wiki &rarr;</a>' : '';
      var imgTag = w.image_url ? '<img class="wiki-img" src="' + escapeHTML(w.image_url) + '" alt="' + escapeHTML(w.title) + '">' : '';

      var isAdmin = currentUser && currentUser.user_metadata && currentUser.user_metadata.display_name.toLowerCase() === "pester";
      var deleteBtnHtml = isAdmin ? '<button type="button" class="btn-delete-admin" onclick="deleteWiki(' + w.id + ')">Delete (Admin)</button>' : '';

      card.innerHTML =
        imgTag +
        '<h4>' + escapeHTML(w.title) + '</h4>' +
        '<p class="wiki-meta">Made by: <strong>' + escapeHTML(w.author_name) + '</strong> &bull; ' + dateStr + '</p>' +
        '<p class="wiki-text">' + escapeHTML(w.description) + '</p>' +
        extLink +
        '<br>' + deleteBtnHtml;

      wikiGrid.appendChild(card);
    });
  }

  toggleThreadFormBtn.addEventListener("click", function () {
    if (!currentUser) {
      openAuthModal("login");
      alert("Please log in to start a forum thread.");
      return;
    }
    threadFormBox.hidden = !threadFormBox.hidden;
  });

  cancelThreadBtn.addEventListener("click", function () {
    threadFormBox.hidden = true;
    threadForm.reset();
  });

  threadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!currentUser) return;

    var title = document.getElementById("threadTitle").value.trim();
    var firstPost = document.getElementById("threadFirstPost").value.trim();
    var imgInput = document.getElementById("threadImage");
    var author = currentUser.user_metadata.display_name || "User";

    var uploadedImgUrl = await uploadImageFile(imgInput);

    var threadRes = await client.from("forum_threads").insert([{
      title: title,
      user_id: currentUser.id,
      author_name: author
    }]).select();

    if (threadRes.error) {
      alert("Error creating thread: " + threadRes.error.message);
      return;
    }

    var newThread = threadRes.data[0];

    await client.from("forum_posts").insert([{
      thread_id: newThread.id,
      content: firstPost,
      image_url: uploadedImgUrl,
      user_id: currentUser.id,
      author_name: author
    }]);

    threadForm.reset();
    threadFormBox.hidden = true;
    loadThreads();
  });

  async function loadThreads() {
    if (!client) return;
    var res = await client.from("forum_threads").select("*").order("created_at", { ascending: false });
    if (res.error) {
      threadTableBody.innerHTML = '<tr><td colspan="3" class="status-msg">Failed to load threads.</td></tr>';
      return;
    }

    if (!res.data || res.data.length === 0) {
      threadTableBody.innerHTML = '<tr><td colspan="3" class="status-msg">No discussions yet. Click "+ New Thread" to start one!</td></tr>';
      return;
    }

    threadTableBody.innerHTML = "";
    res.data.forEach(function (t) {
      var tr = document.createElement("tr");
      var dateStr = new Date(t.created_at).toLocaleDateString();

      tr.innerHTML =
        '<td><a href="#forums" class="thread-row-title" data-id="' + t.id + '">' + escapeHTML(t.title) + '</a></td>' +
        '<td class="thread-row-meta">' + escapeHTML(t.author_name) + '</td>' +
        '<td class="thread-row-meta">' + dateStr + '</td>';

      tr.querySelector(".thread-row-title").addEventListener("click", function (e) {
        e.preventDefault();
        openThread(t.id, t.title);
      });

      threadTableBody.appendChild(tr);
    });
  }

  async function openThread(threadId, title) {
    currentThreadId = threadId;
    viewThreadTitle.textContent = title;
    forumThreadListContainer.hidden = true;
    toggleThreadFormBtn.hidden = true;
    threadFormBox.hidden = true;
    threadViewer.hidden = false;

    loadThreadPosts(threadId);
  }

  backToThreadsBtn.addEventListener("click", function () {
    currentThreadId = null;
    threadViewer.hidden = true;
    forumThreadListContainer.hidden = false;
    toggleThreadFormBtn.hidden = false;
  });

  async function loadThreadPosts(threadId) {
    threadPostsContainer.innerHTML = '<p class="status-msg">Loading posts...</p>';
    var res = await client.from("forum_posts").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });

    if (res.error) {
      threadPostsContainer.innerHTML = '<p class="status-msg">Failed to load posts.</p>';
      return;
    }

    threadPostsContainer.innerHTML = "";
    res.data.forEach(function (p) {
      var box = document.createElement("div");
      box.className = "forum-post-box";
      var dateStr = new Date(p.created_at).toLocaleString();
      var imgTag = p.image_url ? '<img class="post-attachment-img" src="' + escapeHTML(p.image_url) + '" alt="attachment">' : '';

      var isAdmin = currentUser && currentUser.user_metadata && currentUser.user_metadata.display_name.toLowerCase() === "pester";
      var deletePostBtn = isAdmin ? '<button type="button" class="btn-delete-admin" onclick="deletePost(' + p.id + ')">Delete Reply</button>' : '';

      box.innerHTML =
        '<div class="forum-post-user">' +
          '<strong>' + escapeHTML(p.author_name) + '</strong>' +
          '<span class="post-date-stamp">' + dateStr + '</span>' +
          deletePostBtn +
        '</div>' +
        '<div class="forum-post-body">' + 
          escapeHTML(p.content).replace(/\n/g, "<br>") + 
          imgTag + 
        '</div>';

      threadPostsContainer.appendChild(box);
    });
  }

  replyForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal("login");
      alert("Please log in to submit a reply.");
      return;
    }

    var content = document.getElementById("replyContent").value.trim();
    var imgInput = document.getElementById("replyImage");
    if (!content || !currentThreadId) return;

    var author = currentUser.user_metadata.display_name || "User";
    var uploadedImgUrl = await uploadImageFile(imgInput);

    var res = await client.from("forum_posts").insert([{
      thread_id: currentThreadId,
      content: content,
      image_url: uploadedImgUrl,
      user_id: currentUser.id,
      author_name: author
    }]);

    if (res.error) {
      alert("Error sending reply: " + res.error.message);
    } else {
      replyForm.reset();
      loadThreadPosts(currentThreadId);
    }
  });

  window.deleteWiki = async function(id) {
    if (!confirm("Admin Action: Are you sure you want to delete this wiki?")) return;
    var res = await client.from("wikis").delete().eq("id", id);
    if (res.error) alert("Error deleting: " + res.error.message);
    else loadWikis();
  };

  window.deletePost = async function(id) {
    if (!confirm("Admin Action: Are you sure you want to delete this post?")) return;
    var res = await client.from("forum_posts").delete().eq("id", id);
    if (res.error) alert("Error deleting: " + res.error.message);
    else if (currentThreadId) loadThreadPosts(currentThreadId);
  };

  loadWikis();
  loadThreads();
})();
