const postedInternshipsKey = "collegeInternshipHub.postedInternships";
const readPostedInternships = () => {
  try {
    const internships = JSON.parse(localStorage.getItem(postedInternshipsKey) || "[]");
    if (!Array.isArray(internships)) return [];
    const activeInternships = internships.filter((internship) => !deadlineHasPassed(internship.deadline));
    if (activeInternships.length !== internships.length)
      localStorage.setItem(postedInternshipsKey, JSON.stringify(activeInternships));
    return activeInternships;
  } catch {
    return [];
  }
};
const studentRollPattern = /^(?:Y|L)\d{2}[A-Z]{2,3}\d{3}$/;
const deadlineHasPassed = (deadline) => {
  const date = String(deadline || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return date < todayString;
};
const jobs = readPostedInternships().filter((internship) => internship.approved === true);
const facultyAnnouncementsKey = "collegeInternshipHub.facultyAnnouncements";
const facultyEventsKey = "collegeInternshipHub.facultyEvents";
const facultyActivityKey = "collegeInternshipHub.facultyActivity";
const readLocalList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};
const writeLocalList = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const addFacultyActivity = (text, route) => {
  const activity = readLocalList(facultyActivityKey);
  activity.unshift({ id: crypto.randomUUID(), text, route, createdAt: new Date().toISOString() });
  writeLocalList(facultyActivityKey, activity.slice(0, 30));
};
const sidebar = (items, on) =>
  `<div class="side"><b>${on}</b><hr>${items.map((i) => `<a href="#${i[1]}">${i[0]}</a>`).join("")}</div>`;
const studentSide = sidebar(
  [
    ["Dashboard", "dashboard"],
    ["My Saved Internships", "search"],
    ["Announcements", "announcements"],
    ["Events", "events"],
    ["My Questions", "ask"],
    ["My Submissions", "verify"],
    ["Log Out", "home"],
  ],
  "Student",
);
const adminSide = sidebar(
  [
    ["Verify Documents", "admin"],
    ["Manage Internships", "search"],
    ["Manage Coordinators", "companies"],
    ["Manage Companies", "companies"],
    ["Analytics", "analytics"],
    ["Log Out", "home"],
  ],
  "Admin Dashboard",
);
const jobCard = (j, index) => {
  return `<div class="card job" onclick="sessionStorage.setItem('collegeInternshipHub.selectedJob', '${index}');location.hash='details'"><div class="logo">${escapeHTML(j.logo || String(j.co || "?").slice(0, 2).toUpperCase())}</div><div><b>${escapeHTML(j.role)}</b><br><span class="tag b">${escapeHTML(j.src || "College Source")}</span>${j.verified === false ? '<span class="tag o">Pending Verification</span>' : '<span class="tag">✔ Verified</span>'}<div class="mut">${escapeHTML(j.co)} | ${escapeHTML(j.yr)}${j.dur ? ` | ${escapeHTML(j.dur)}` : ""}${j.skills ? `<br>Skills: ${escapeHTML(j.skills)}` : ""}${j.deadline ? `<br>Deadline: ${escapeHTML(j.deadline)}` : ""}<br>Location: ${escapeHTML(j.loc)} | Stipend: ${escapeHTML(j.pay)}</div></div></div>`;
};
const facultyIcon = (symbol) => {
  const iconNames = { "⌂": "dashboard", "✓": "verified_user", "▣": "business_center", "♙": "groups", "▤": "description", "◉": "campaign", "⚙": "settings", "↗": "school", "👥": "groups", "＋": "add" };
  return `<span class="material-symbols-rounded" aria-hidden="true">${iconNames[symbol] || symbol}</span>`;
};
const emptyMetric = (value) => (Number(value) > 0 ? value : "");
function facultyDashboard() {
  const user = getUser();
  const students = readAccounts().filter((account) => account.role === "student");
  const studentInternships = students.flatMap((student) =>
    internshipList(student).map((internship) => ({ student, internship })),
  );
  const pending = studentInternships.filter(({ internship }) => !internship.verified && internship.verificationStatus !== "rejected");
  const verified = studentInternships.filter(({ internship }) => internship.verified);
  const internships = readPostedInternships().filter((internship) => internship.approved === true);
  const pendingPostCount = readPostedInternships().filter((internship) => !internship.approved && internship.approvalStatus !== "rejected").length;
  const events = readLocalList(facultyEventsKey)
    .filter((event) => event.date && event.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const activities = readLocalList(facultyActivityKey).slice(0, 5);
  const displayDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date());
    return `<div class="faculty-dashboard">
      <aside class="faculty-sidebar"><a class="faculty-sidebar-brand" href="#home">${facultyIcon("school")}RVR<span>+</span></a><p class="faculty-sidebar-label">FACULTY WORKSPACE</p>${[
        ["⌂", "Dashboard", "home"], ["✓", "Verify Documents", "verify"], ["▣", "Manage Internships", "coordinator"], ["♙", "Student Records", "students"], ["▤", "Reports & Analytics", "analytics"], ["◉", "Announcements", "announcements"], ["⚙", "Settings", "profile"],
      ].map(([icon, label, route], index) => `<a class="faculty-side-link${index === 0 ? " active" : ""}" href="#${route}">${facultyIcon(icon)}${label}</a>`).join("")}<div class="faculty-sidebar-note">${facultyIcon("school")}<b>Empowering students with real opportunities</b><small>R.V.R. & J.C. College of Engineering</small></div></aside>
    <section class="faculty-main"><div class="faculty-welcome"><div><span class="faculty-eyebrow">FACULTY DASHBOARD · ${escapeHTML(displayDate)}</span><h1>Welcome back, ${escapeHTML(user?.name || "Faculty")}</h1><p>${escapeHTML(user?.dept || "Faculty workspace")} · Your guidance opens doors to new opportunities.</p></div><button id="facultyNotifications" class="faculty-notification" type="button" aria-label="Show notifications">♧<span>${emptyMetric(pending.length + pendingPostCount) || ""}</span></button><div id="facultyNotificationPanel" class="faculty-notification-panel" hidden>${pending.length || pendingPostCount ? `<b>${pending.length} student records and ${pendingPostCount} postings need review</b><a href="#notifications">Open notifications</a>` : "You're all caught up."}</div></div>
      <div class="faculty-search-row"><form id="facultyGlobalSearch"><input name="query" id="facultySearchInput" placeholder="Search students, companies, or internships..." aria-label="Global faculty search"><select name="department" aria-label="Department"><option value="">All departments</option>${[...new Set(students.map((student) => student.branch).filter(Boolean))].sort().map((branch) => `<option>${escapeHTML(branch)}</option>`).join("")}</select><select name="year" aria-label="Student year"><option value="">All years</option>${["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => `<option>${year}</option>`).join("")}</select><button type="submit" class="faculty-search-button">Search</button></form></div>
      <div class="faculty-stat-grid"><a class="faculty-stat stat-blue" href="#students">${facultyIcon("groups")}<small>Total Students</small><b>${emptyMetric(students.length)}</b><em>Registered on portal</em></a><a class="faculty-stat stat-green" href="#coordinator">${facultyIcon("work")}<small>Open Internships</small><b>${emptyMetric(internships.length)}</b><em>College opportunities</em></a><a class="faculty-stat stat-violet" href="#verify">${facultyIcon("description")}<small>Pending Verifications</small><b>${emptyMetric(pending.length)}</b><em>Student records to review</em></a><a class="faculty-stat stat-orange" href="#verified-records">${facultyIcon("verified_user")}<small>Verified Records</small><b>${emptyMetric(verified.length)}</b><em>Approved student records</em></a></div>
      <section class="faculty-section"><div class="faculty-section-title"><h2>Faculty tools</h2><span>Shortcuts to daily work</span></div><div class="faculty-feature-grid">${[
        ["verified_user", "Verify Documents", "Review student internship records", "verify", "blue"], ["business_center", "Manage Internships", "Create, publish, and remove postings", "coordinator", "green"], ["groups", "Student Management", "Search profiles and histories", "students", "violet"], ["fact_check", "Approve College Internships", "Review pending opportunities", "approvals", "orange"], ["bar_chart", "Reports & Analytics", "Participation and verification data", "analytics", "blue"], ["campaign", "Announcements", "Share updates with students", "announcements", "pink"], ["person_add", "Manage Coordinators", "Assign department responsibilities", "coordinators", "teal"], ["apartment", "Company Directory", "Browse internship partners", "directory", "violet"],
      ].map(([icon, title, description, route, color]) => `<a class="faculty-feature faculty-${color}" href="#${route}"><span class="faculty-feature-icon">${facultyIcon(icon)}</span><b>${title}</b><small>${description}</small>${facultyIcon("arrow_forward")}</a>`).join("")}</div></section>
      <section class="faculty-section"><div class="faculty-section-title"><h2>Quick access</h2><span>Frequently used</span></div><div class="faculty-quick-grid"><a href="#coordinator">${facultyIcon("add")}<span><b>Add Internship</b><small>Post a college opportunity</small></span></a><a href="#verify">${facultyIcon("description")}<span><b>Pending Reviews</b><small>${pending.length ? pending.length + " student records" : ""}</small></span></a><a href="#students">${facultyIcon("groups")}<span><b>Student Progress</b><small>View internship histories</small></span></a><a href="#coordinator">${facultyIcon("apartment")}<span><b>College Internships</b><small>Official opportunities</small></span></a></div></section>
      <div class="faculty-lower-grid"><section class="faculty-panel"><div class="faculty-section-title"><h2>Recent activity</h2><a href="#activities">View records ↗</a></div>${activities.length ? activities.map((activity) => `<a class="faculty-activity" href="#${escapeHTML(activity.route || "activities")}"><span>•</span><div><b>${escapeHTML(activity.text)}</b><small>${escapeHTML(new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.createdAt)))}</small></div></a>`).join("") : '<p class="faculty-empty">No recent faculty activity yet.</p>'}</section><section class="faculty-panel"><div class="faculty-section-title"><h2>Upcoming events</h2><a href="#events">Manage ↗</a></div>${events.length ? events.map((event) => `<div class="faculty-event"><time datetime="${escapeHTML(event.date)}">${escapeHTML(new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(`${event.date}T12:00:00`)))}</time><div><b>${escapeHTML(event.title)}</b><small>${escapeHTML(event.time || "Time not set")} · ${escapeHTML(event.audience || "All students")}</small></div></div>`).join("") : '<p class="faculty-empty">No upcoming events have been added.</p>'}</section></div>
      <section class="faculty-section"><div class="faculty-section-title"><h2>Latest announcements</h2><a href="#announcements">Manage ↗</a></div><div class="faculty-announcement-strip">${readLocalList(facultyAnnouncementsKey).slice(0, 2).map((announcement) => `<a href="#announcements"><b>${escapeHTML(announcement.title)}</b><small>${escapeHTML(announcement.audience || "All students")} · ${escapeHTML(announcement.date || "Published")}</small></a>`).join("") || '<p class="faculty-empty">No announcements have been published.</p>'}</div></section>
      <footer class="faculty-footer"><span>R.V.R. & J.C. College of Engineering, Guntur</span><a href="#about">About</a><a href="#support">Help / Support</a><a href="#profile">Profile</a><button type="button" onclick="logout()">Log out</button></footer>
    </section></div>`;
}
const pages = {
  home: () => getUser()?.role === "faculty"
    ? facultyDashboard()
    : `<section class="hero"><div class="hero-copy"><span class="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h1>Find the work<br>that moves you.</h1><p>Explore verified internships, learn from students who've been there, and make your next move with confidence.</p><div class="hero-actions"><a class="btn" href="#search">Explore internships <span aria-hidden="true">↗</span></a></div><div class="hero-proof"><span><b>✓</b> College-verified roles</span><span><b>✳</b> Advice from your seniors</span></div></div><div class="hero-note"><span class="note-icon">✦</span><span><b>Small steps.</b><br>Big beginnings.</span></div></section>
<div class="grid g3" style="margin-top:16px">${[
    [
      "🏛️",
      "College Internships",
      "Opportunities through college network",
      "college-internships",
    ],
    [
      "🌐",
      "Self-Found Internships",
      "Opportunities through personal network",
      "self-found-internships",
    ],
    [
      "📘",
      "Learn from Seniors",
      "Real experiences & step-by-step guides",
      "senior",
    ],
  ]
    .map(
      (c) =>
        `<a class="card c" href="#${c[3]}"><div class="ico">${c[0]}</div><b>${c[1]}</b><div class="mut">${c[2]}</div></a>`,
    )
    .join("")}</div>
<p class="mut">The homepage gives an overview of the platform and its key features. Students can explore internships or read senior experiences.</p>`,
  login:
    () => `<div class="card login"><h2 style="text-align:center">🎓 College Internship Hub</h2><div class="tabs"><span class="on" id="tl">Login</span><span id="ts">Sign Up</span></div>
<form id="loginForm" novalidate><div class="roles" id="roles">
  <label class="role on"><input type="radio" name="role" value="student" checked>🎓 Student</label>
  <label class="role"><input type="radio" name="role" value="faculty">👨‍🏫 Faculty</label>
  <label class="role"><input type="radio" name="role" value="admin">🛡️ Admin</label>
</div>
<div id="signupFields" hidden><input id="signupName" type="text" placeholder="Full name" autocomplete="name" aria-describedby="signupNameError"><p id="signupNameError" class="field-error" hidden></p><input id="signupMemberId" type="text" placeholder="Roll, employee, or user ID" autocapitalize="characters" title="Student format: Y or L + two-digit year + branch code + three-digit serial (e.g. Y23EC013 or L24EC199)" aria-describedby="signupMemberIdError"><p id="signupMemberIdError" class="field-error" hidden></p><input id="signupContact" type="tel" placeholder="Phone number (optional)" autocomplete="tel"></div>
<input id="authEmail" type="email" placeholder="Email address" autocomplete="email" required aria-describedby="authEmailError"><p id="authEmailError" class="field-error" hidden></p><input id="loginPassword" type="password" placeholder="Password" autocomplete="current-password" required aria-describedby="loginPasswordError"><p id="loginPasswordError" class="field-error" hidden></p><div id="confirmField" hidden><input id="confirmPassword" type="password" placeholder="Confirm password" autocomplete="new-password" aria-describedby="confirmPasswordError"><p id="confirmPasswordError" class="field-error" hidden></p></div><p id="authError" class="mut" role="alert" hidden></p><p id="authSuccess" class="auth-success" role="status" hidden></p><button class="btn full" id="authSubmit">Login</button></form>
<p id="signupPrompt" class="auth-prompt">Don't have an account? <a href="#login" id="signupPromptLink">Sign up</a></p><section id="forgotPasswordSection" class="forgot-password"><button type="button" id="forgotPasswordBtn">Forgot password?</button><p id="forgotPasswordInfo" role="status" hidden>Password recovery is managed by your college administrator. Please contact them to reset your password.</p></section>
</div>`,
  categories:
    () => `<h1>Internships</h1><div class="grid g2"><div class="card c"><div class="ico">🏛️</div><h2>College-Sourced Internships</h2><p class="mut">Opportunities provided through college coordinators, placement cell, faculty recommendation and college/company connections.</p><a class="btn full" href="#college-internships">View College Internships</a></div>
<div class="card c"><div class="ico">🌐</div><h2>Self-Found Internships</h2><p class="mut">Opportunities obtained independently through LinkedIn, referrals, company websites, personal network, etc.</p><a class="btn out full" href="#self-found-internships">Add Self-Found Internship</a></div></div>
<p class="mut">Students can choose between College-Sourced or Self-Found internships.</p>`,
  "college-internships": () => {
    if (getUser()?.role !== "student")
      return '<h1>College Internships</h1><p class="mut">This page is available to student accounts.</p>';
    const collegeInternships = readPostedInternships().filter((internship) => internship.approved === true);
    const cards = collegeInternships
      .map((internship) => {
        let applicationHref = "";
        let applicationLink = "Not provided";
        try {
          const url = new URL(internship.applicationLink);
          if (["http:", "https:"].includes(url.protocol)) {
            applicationHref = url.href;
            applicationLink = `<a class="btn posted-apply" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">Apply now</a>`;
          }
        } catch {
          applicationLink = "Not provided";
        }
        const eligibility = Array.isArray(internship.eligibility)
          ? internship.eligibility.join(", ")
          : internship.yr || "Not specified";
        const searchable = [internship.co, internship.role, internship.loc, internship.pay, eligibility].join(" ");
        const roleTitle = applicationHref
          ? `<a class="posted-job-title" href="${escapeHTML(applicationHref)}" target="_blank" rel="noopener noreferrer">${escapeHTML(internship.role)}</a>`
          : `<span class="posted-job-title">${escapeHTML(internship.role)}</span>`;
        return `<article class="posted-job" data-search="${escapeHTML(searchable.toLowerCase())}" data-location="${escapeHTML(internship.loc).toLowerCase()}"><div class="posted-company-mark" aria-hidden="true">${escapeHTML(internship.logo || String(internship.co || "?").slice(0, 2).toUpperCase())}</div><div class="posted-job-content">${roleTitle}<div class="posted-company">${escapeHTML(internship.co)}</div><div class="posted-job-meta"><span>${escapeHTML(internship.loc)}</span><span>${escapeHTML(internship.pay)}</span></div><div class="posted-job-tags"><span>${escapeHTML(eligibility)}</span><span>College posted</span></div><div class="posted-job-deadline">Apply by ${escapeHTML(internship.deadline || "Not specified")}</div></div><div class="posted-job-action">${applicationLink}</div></article>`;
      })
      .join("");
    return `<section class="posted-search-page"><div class="posted-search-heading"><span class="posted-search-kicker">COLLEGE INTERNSHIPS</span><h1>Find your next internship</h1><p>Opportunities shared by your college.</p></div><form class="posted-search-bar" id="postedSearchForm" role="search"><label>What<input id="postedSearch" type="search" placeholder="Job title, company, or eligibility"></label><label>Where<input id="postedLocation" type="search" placeholder="City or remote"></label><button class="btn" type="submit">Find internships</button></form><div class="posted-results-layout"><aside class="posted-results-aside"><b>Search tips</b><p>Search by role, company, branch, or location.</p><a href="#self-found-internships">Browse self-found internships</a></aside><section class="posted-results" aria-live="polite"><div class="posted-results-heading"><h2>College-posted internships</h2><span id="postedResultCount">${collegeInternships.length} ${collegeInternships.length === 1 ? "job" : "jobs"}</span></div><div id="postedJobList">${cards || '<div class="posted-empty">No college internships have been posted yet.</div>'}</div></section></div></section>`;
  },
  "self-found-internships": () => {
    const user = getUser();
    if (user?.role !== "student")
      return '<h1>Self-Found Internships</h1><p class="mut">This page is available to student accounts.</p>';
    const internships = Array.isArray(user.selfFoundInternships) ? user.selfFoundInternships : [];
    const cards = internships.map((internship) => {
      let applicationLink = "Not provided";
      try {
        const url = new URL(internship.applicationLink);
        if (["http:", "https:"].includes(url.protocol))
          applicationLink = `<a class="btn posted-apply" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">Apply now</a>`;
      } catch {
        applicationLink = "Not provided";
      }
      const eligibility = Array.isArray(internship.eligibility) ? internship.eligibility.join(", ") : "Not specified";
      const searchable = [internship.companyName, internship.role, internship.location, internship.stipend, eligibility].join(" ");
      const companyMark = String(internship.companyName || "?").trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
      return `<article class="posted-job" data-search="${escapeHTML(searchable.toLowerCase())}" data-location="${escapeHTML(internship.location).toLowerCase()}"><div class="posted-company-mark" aria-hidden="true">${escapeHTML(companyMark)}</div><div class="posted-job-content"><div class="posted-job-title">${escapeHTML(internship.role)}</div><div class="posted-company">${escapeHTML(internship.companyName)}</div><div class="posted-job-meta"><span>${escapeHTML(internship.location)}</span><span>${escapeHTML(formatMoney(internship.stipend))}/month</span></div><div class="posted-job-tags"><span>${escapeHTML(eligibility)}</span><span>Self-found</span></div><div class="posted-job-deadline">Apply by ${escapeHTML(internship.deadline || "Not specified")}</div></div><div class="posted-job-action">${applicationLink}</div></article>`;
    }).join("");
    return `<h1>Self-Found Internships</h1><div class="card faculty-post-card"><h2>Add Internship Details</h2><form id="selfFoundForm"><div class="post-internship-fields"><label>Company Name<input name="companyName" placeholder="ABC Technologies" required></label><label>Role<input name="role" placeholder="Data Analyst Intern" required></label><label>Location<input name="location" placeholder="Hyderabad or Remote" required></label><label>Stipend (Rs./month)<input name="stipend" type="number" min="0" step="0.01" placeholder="15000" required></label><label>Application deadline<input name="deadline" type="date" required></label><fieldset class="eligibility-options"><legend>Eligibility (select at least one)</legend>${["CSE", "CSD", "CSM", "EEE", "ECE", "Civil", "Mechanical", "IoT", "IT"].map((branch) => `<label><input type="checkbox" name="eligibility" value="${branch}">${branch}</label>`).join("")}</fieldset><label class="post-form-full">Application link<input name="applicationLink" type="url" placeholder="https://company.com/apply" required></label><div class="post-form-actions"><button class="btn" type="submit">Save Internship</button></div></div></form></div><section class="self-found-results posted-search-page"><div class="posted-results-heading"><h2>My Self-Found Internships</h2><span id="selfFoundResultCount">${internships.length} ${internships.length === 1 ? "job" : "jobs"}</span></div><form class="posted-search-bar" id="selfFoundSearchForm" role="search"><label>What<input id="selfFoundSearch" type="search" placeholder="Job title or company"></label><label>Where<input id="selfFoundLocation" type="search" placeholder="City or remote"></label><button class="btn" type="submit">Find internships</button></form><div id="selfFoundJobList">${cards || '<div class="posted-empty">No self-found internships added yet.</div>'}</div></section>`;
  },
  years: () =>
    `<h1>Browse by Year</h1><div class="grid g2">${[
      ["1st Year", "Explore internships suitable for 1st year students"],
      ["2nd Year", "Opportunities for 2nd year students"],
      ["3rd Year", "Industry internships and pre-placement opportunities"],
      ["4th Year", "Final year internships and conversion opportunities"],
    ]
      .map(
        (y) =>
          `<a class="card" href="#search"><b>🎓 ${y[0]}</b><div class="mut">${y[1]}</div></a>`,
      )
      .join(
        "",
      )}</div><p class="mut">Internships are organized by year to help students find relevant opportunities.</p>`,
  search:
    () => `<h1>Internships</h1><div class="split"><aside class="card"><b>Filters</b><p><b>Year</b></p>${["1st", "2nd", "3rd", "4th"].map((y) => `<label><input type="checkbox" class="f" value="${y}" style="width:auto;margin:0 6px 0 0">${y} Year</label>`).join("")}<p><b>Branch</b></p><select><option>Select Branch</option><option>CSE</option><option>ECE</option><option>EEE</option><option>MECH</option><option>CIVIL</option></select><p><b>Type</b></p><label><input type="checkbox" class="t" value="College" style="width:auto;margin:0 6px 0 0">College</label><label><input type="checkbox" class="t" value="Self" style="width:auto;margin:0 6px 0 0">Self Found</label></aside>
<div><input id="q" placeholder="Search by company, role, or skills..."><div id="list">${jobs.map(jobCard).join("") || '<p class="mut">No internships have been posted yet.</p>'}</div></div></div><p class="mut">Use filters to find internships based on year, branch, type, role, location, stipend, etc.</p>`,
  details: () => {
    const selectedIndex = Number(sessionStorage.getItem("collegeInternshipHub.selectedJob"));
    const j = jobs[selectedIndex] || jobs[0];
    if (!j)
      return `<h1>Internship details</h1><p class="mut">No internships have been posted yet.</p><a class="btn out" href="#search">Back to internships</a>`;
    let applicationLink = "Application link not provided";
    try {
      const url = new URL(j.applicationLink);
      if (["http:", "https:"].includes(url.protocol))
        applicationLink = `<a class="btn" href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">Apply now</a>`;
    } catch {
      applicationLink = "Application link not provided";
    }
    return `<a href="#search" class="mut">← Back to Results</a><div class="card" style="margin-top:10px"><div class="job"><div class="logo">${escapeHTML(j.logo || String(j.co || "?").slice(0, 2).toUpperCase())}</div><div><h2 style="margin:0">${escapeHTML(j.role)}</h2><span class="tag b">${escapeHTML(j.src || "College Source")}</span><div class="mut">${escapeHTML(j.co)} | ${escapeHTML(j.yr)}${j.dur ? ` | ${escapeHTML(j.dur)}` : ""} | ${escapeHTML(j.loc)}<br>Stipend: ${escapeHTML(j.pay)}${j.deadline ? `<br>Application deadline: ${escapeHTML(j.deadline)}` : ""}${j.skills ? `<br>Skills: ${escapeHTML(j.skills)}` : ""}</div></div></div>${applicationLink}</div>`;
  },
  senior: () =>
    `<h1>My Internship Journey</h1><div class="card"><div class="mut" style="float:right">Shared by <b>Riya Sharma</b><br>3rd Year, CSE <span class="ok">✔ Verified</span></div><ul class="steps">${[
      ["How I got it", "Source: College Coordinator"],
      ["Application Process", "Submitted through college portal"],
      [
        "Selection Process",
        "Resume Shortlisting → Aptitude Test → Technical Interview → HR Interview",
      ],
      ["Skills Required", "Python, SQL, Excel, Communication"],
      ["Preparation", "SQL basics, Excel practice, previous projects"],
      [
        "Advice for Juniors",
        '"Keep improving your technical skills and be consistent."',
      ],
    ]
      .map(
        (s, i) =>
          `<li data-n="${i + 1}"><b>${s[0]}</b><div class="mut">${s[1]}</div></li>`,
      )
      .join(
        "",
      )}</ul></div><p class="mut">Seniors share their complete journey — from how they got it to their advice for juniors.</p>`,
  verify:
    () => getUser()?.role === "faculty" ? "" : `<h1>Document Verification</h1><div class="card"><div class="doc"><div>📄 <b>Offer Letter</b><div class="mut">Uploaded: 12 Apr 2025</div></div><span class="ok">● Verified</span></div><div class="doc"><div>📄 <b>Completion Certificate</b><div class="mut">Uploaded: 20 Jul 2025</div></div><span class="ok">● Verified</span></div>
<input type="file"><div class="flow"><span>📤<br>Submitted</span><span>📋<br>Admin Review</span><span class="ok">✅<br>Verified</span></div></div><p class="mut">Seniors upload offer letters and completion certificates. Admins verify them before it becomes visible to students.</p>`,
  ask: () =>
    `<h1>Ask a Senior</h1><div class="card"><div style="display:flex;gap:8px"><input id="aq" placeholder="Ask a question about this internship..." style="margin:0"><button class="btn" id="askBtn">Ask</button></div><div id="qs">${[
      [
        "What type of coding questions were asked in the interview?",
        "Rahul (2nd Year, CSE) · 2 days ago",
        "It was mostly DSA based. I was asked array, string and tree related questions. Focus more on problem solving.",
      ],
      [
        "How difficult was the interview process?",
        "Priya (1st Year, CSE) · 3 days ago",
        "The technical round was moderate, HR round was basic and focused on communication.",
      ],
    ]
      .map(
        (q) =>
          `<div class="card" style="margin-top:12px"><b>❓ ${q[0]}</b><div class="mut">${q[1]}</div><p>👤 ${q[2]}</p></div>`,
      )
      .join(
        "",
      )}</div></div><p class="mut">Students can ask questions and get answers from seniors who have already gone through the same process.</p>`,
  dashboard: () =>
    `<div class="dash">${studentSide}<div><h1>Dashboard</h1><div class="grid">${[
      ["Total Internships Viewed", 0],
    ]
      .map(
        (s) =>
          `<div class="card"><div class="mut">${s[0]}</div><div class="stat">${s[1]}</div></div>`,
      )
      .join(
        "",
      )}</div></div></div>`,
  coordinator: () =>
    `<div class="dash">${sidebar(
      [
        ["Post Internship", "coordinator"],
        ["View Submissions", "verify"],
        ["Log Out", "home"],
      ],
      "Coordinator Dashboard",
    )}<div class="card faculty-post-card"><h2>Post New Internship</h2><form id="postForm"><div class="post-internship-fields"><label>Company Name<input name="companyName" placeholder="ABC Technologies" required></label><label>Role<input name="role" placeholder="Data Analyst Intern" required></label><label>Location<input name="location" placeholder="Hyderabad or Remote" required></label><label>Stipend (Rs./month)<input name="stipend" type="number" min="0" step="0.01" placeholder="15000" required></label><label>Application deadline<input name="deadline" type="date" required></label><fieldset class="eligibility-options"><legend>Eligibility (select at least one)</legend>${["CSE", "CSD", "CSM", "EEE", "ECE", "Civil", "Mechanical", "IoT", "IT"].map((branch) => `<label><input type="checkbox" name="eligibility" value="${branch}">${branch}</label>`).join("")}</fieldset><label class="post-form-full">Application link<input name="applicationLink" type="url" placeholder="https://company.com/apply" required></label><a id="applicationLinkPreview" class="application-link-preview" target="_blank" rel="noopener noreferrer" hidden></a><div class="post-form-actions"><button class="btn" type="submit">Post Internship</button></div></div></form></div></div>`,
  admin: () =>
    `<div class="dash">${adminSide}<div class="card"><h2>Pending Verifications</h2><table id="vt"><tr><th>Student</th><th>Company</th><th>Document</th><th>Action</th></tr>${[
      ["Riya Sharma", "TCS", "Offer Letter"],
      ["Arjun Kumar", "Microsoft", "Offer Letter"],
      ["Sneha Patel", "Infosys", "Certificate"],
    ]
      .map(
        (r) =>
          `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><a href="#verify" class="mut">View</a> <button class="btn ap">Approve</button></td></tr>`,
      )
      .join(
        "",
      )}</table></div></div><p class="mut">Admins verify documents, manage content and view platform analytics.</p>`,
  companies: () =>
    `<div class="dash">${adminSide}<div class="card"><div style="display:flex;justify-content:space-between"><h2>Manage Companies</h2><button class="btn" id="addCo">+ Add Company</button></div><table id="ct"><tr><th>Company Name</th><th>Type</th><th>Actions</th></tr>${[
      ["TCS", "College"],
      ["Microsoft", "Self Found"],
      ["Infosys", "College"],
      ["Amazon", "Self Found"],
    ]
      .map(
        (r) =>
          `<tr><td>${r[0]}</td><td>${r[1]}</td><td><button class="btn out">Edit</button> <button class="btn del" style="background:#dc2626">Delete</button></td></tr>`,
      )
      .join(
        "",
      )}</table></div></div><p class="mut">Admins can manage companies and coordinators.</p>`,
  analytics: () =>
    `<div class="dash">${adminSide}<div><h1>Internship Insights</h1><div class="grid g3">${[
      ["Total Internships", 248],
      ["College Sourced", 96],
      ["Self Found", 152],
    ]
      .map(
        (s) =>
          `<div class="card"><div class="mut">${s[0]}</div><div class="stat">${s[1]}</div></div>`,
      )
      .join(
        "",
      )}</div><div class="card" style="margin-top:16px"><b>Internships by Year</b><div class="bars">${[45, 72, 90, 41].map((v, i) => `<div style="height:${v}%">${v}<br>${i + 1}st</div>`).join("")}</div></div></div></div><p class="mut">Shows overall statistics and insights about internships.</p>`,
  activities: () => {
    const user = getUser();
    if (user?.role !== "faculty")
      return `<h1>Student Activities</h1><p class="mut">This page is available to faculty accounts.</p><a class="btn out" href="#${dash[user?.role] || "home"}">Back to dashboard</a>`;
    const rows = readAccounts()
      .filter((student) => student.role === "student")
      .flatMap((student) =>
        internshipList(student).map((internship) =>
          `<tr><td>${escapeHTML(student.name || student.email)}</td><td>${escapeHTML(student.id || "Not set")}</td><td>${escapeHTML([student.branch, student.year].filter(Boolean).join(" · ") || "Not set")}</td><td>${escapeHTML(internship.internshipName || "Not set")}</td><td>${escapeHTML(internship.durationMonths || "Not set")}</td><td>${escapeHTML(internship.payment ?? "Not set")}</td></tr>`,
        ),
      )
      .join("");
    return `<h1>Student Activities</h1><div class="internship-table-wrap"><table class="internship-table"><thead><tr><th>Student</th><th>Roll Number</th><th>Branch / Year</th><th>Internship</th><th>Duration (months)</th><th>Stipend (Rs.)</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="mut">No student internship activities yet.</td></tr>'}</tbody></table></div>`;
  },
  journey: () =>
    `<h1>Example: Student Journey</h1><div class="grid g4">${[
      ["🔍", "Explore Internships"],
      ["📖", "Learn from Seniors"],
      ["💬", "Ask Questions"],
      ["📝", "Apply & Prepare"],
      ["✈️", "Get Internship"],
    ]
      .slice(0, 4)
      .map(
        (s) =>
          `<div class="card c"><div class="ico">${s[0]}</div><b>${s[1]}</b></div>`,
      )
      .join(
        "",
      )}</div><div class="card" style="margin-top:16px"><b>Example Path</b> — 2nd Year CSE Student → TCS Data Analyst Intern (College Source)<ul><li>Found opportunity in College Internships</li><li>Read senior's experience and preparation tips</li><li>Asked a question in the Ask a Senior section</li><li>Applied and went through the selection process</li><li>Got the internship!</li></ul></div><p class="mut">A complete pathway from finding the opportunity to getting the internship.</p>`,
};
const dash = { student: "dashboard", faculty: "home", admin: "admin" };
const accountsKey = "collegeInternshipHub.accounts";
const currentAccountKey = "collegeInternshipHub.currentAccount";
const readAccounts = () => {
  try {
    const accounts = JSON.parse(localStorage.getItem(accountsKey) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
};
const writeAccounts = (accounts) =>
  localStorage.setItem(accountsKey, JSON.stringify(accounts));
const getUser = () => {
  const accountId = localStorage.getItem(currentAccountKey);
  const account = readAccounts().find((item) => item.accountId === accountId);
  if (!account) return null;
  const { passwordSalt, passwordHash, ...user } = account;
  return user;
};
const showFailure = (error) => {
  console.error(error);
  const message = error?.message || "Something went wrong. Please try again.";
  const authError = document.getElementById("authError");
  if (authError) {
    authError.textContent = message;
    authError.hidden = false;
  } else {
    alert(message);
  }
};
const encodeBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const decodeBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
const derivePasswordHash = async (password, salt) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    key,
    256,
  );
  return encodeBase64(new Uint8Array(bits));
};
const createPasswordRecord = async (password) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { passwordSalt: encodeBase64(salt), passwordHash: await derivePasswordHash(password, salt) };
};
const verifyPassword = async (password, account) =>
  (await derivePasswordHash(password, decodeBase64(account.passwordSalt))) === account.passwordHash;
const updateProfile = async (changes) => {
  const user = getUser();
  const accounts = readAccounts();
  const accountIndex = accounts.findIndex((account) => account.accountId === user?.accountId);
  if (accountIndex < 0) throw new Error("Your local account could not be found. Please log in again.");
  accounts[accountIndex] = { ...accounts[accountIndex], ...changes };
  writeAccounts(accounts);
  return getUser();
};
const ini = (u) => (u.name || u.id || "?")[0].toUpperCase();
const opt = (a, v) =>
  a.map((x) => `<option ${x === v ? "selected" : ""}>${x}</option>`).join("");
const av = (u, big) =>
  `<span class="avatar${big ? " big" : ""}">${u.photo ? `<img src="${u.photo}" alt="">` : ini(u)}</span>`;
const saveUser = async (changes) => {
  try {
    await updateProfile(changes);
    route();
  } catch (error) {
    showFailure(error);
  }
};
const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
const internshipList = (user) => {
  if (Array.isArray(user.internships)) return user.internships;
  const plan = user.internshipPlan || {};
  return [plan].filter((internship) =>
    [internship.internshipName, internship.period, internship.payment].some(
      (value) => String(value ?? "").trim(),
    ),
  );
};
const paymentAmount = (value) => {
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};
const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
const internshipTotalAmount = (internship) => {
  const payment = paymentAmount(internship.payment);
  return payment !== null && payment >= 0 ? payment : null;
};
const internshipDetails = (u) => {
  const internships = internshipList(u);
  const rows = internships
    .map(
      (internship, index) => {
        const total = internshipTotalAmount(internship);
        return `<tr><td>${escapeHTML(internship.internshipName)}</td><td>${escapeHTML(internship.durationMonths || "Not set")}</td><td>${total === null ? "Add duration and stipend" : formatMoney(total)}</td><td><input class="internship-verification" type="checkbox" data-index="${index}" aria-label="Mark ${escapeHTML(internship.internshipName || "internship")} as verified" ${internship.verified ? "checked" : ""}></td><td><div class="internship-row-actions"><button class="btn out edit-internship" type="button" data-index="${index}">Edit</button><button class="btn delete-internship" type="button" data-index="${index}">Delete</button></div></td></tr>`;
      },
    )
    .join("");
  const totals = internships.map(internshipTotalAmount);
  const totalPayment = totals.every((amount) => amount !== null)
    ? formatMoney(totals.reduce((sum, amount) => sum + amount, 0))
    : "Complete missing stipend details";
  return `<section class="card internship-card"><div class="internship-heading"><div><h2>My Internships</h2><p class="mut">Add each internship to keep your experience in one list.</p></div></div>
<form id="internshipDetailsForm" class="internship-details"><label>Internship name<input name="internshipName" placeholder="e.g. Data Analyst Intern at TCS" required></label><label>Duration (months)<input name="durationMonths" type="number" min="1" step="1" placeholder="e.g. 3" required></label><label>Stipend (Rs.)<input name="payment" type="number" min="0" step="0.01" placeholder="e.g. 45000" required></label><div class="internship-form-actions"><button class="btn" type="submit">Add internship</button><button class="btn out" id="cancelInternshipEdit" type="button" hidden>Cancel edit</button></div></form>
<div class="internship-table-wrap"><table class="internship-table"><thead><tr><th>Internship</th><th>Duration (months)</th><th>Stipend</th><th>Verification</th><th>Action</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="mut">No internships added yet.</td></tr>'}</tbody><tfoot><tr><th colspan="2">Total stipend</th><td>${totalPayment}</td><td></td><td></td></tr></tfoot></table></div></section>`;
};
pages.profile = () => {
  const u = getUser();
  if (!u) {
    location.hash = "login";
    return "";
  }
  const L = {
    student: ["Roll Number", "Phone Number"],
    faculty: ["Employee Number", "Phone Number"],
    admin: ["User ID", "Phone Number"],
  }[u.role];
  const extra =
    u.role === "student"
      ? `Branch<select name="branch">${opt(["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"], u.branch)}</select>Year<select name="year">${opt(["1st Year", "2nd Year", "3rd Year", "4th Year"], u.year)}</select>`
      : u.role === "faculty"
        ? `Department<input name="dept" value="${escapeHTML(u.dept || "")}" placeholder="e.g. CSE">Designation<input name="designation" value="${escapeHTML(u.designation || "")}" placeholder="e.g. Professor">`
        : `Department<input name="dept" value="${u.dept || ""}" placeholder="e.g. CSE">`;
  const profileSummary =
    u.role === "faculty"
      ? ""
      : `${u.about ? `<p class="mut" style="text-align:left">${u.about.replace(/</g, "&lt;")}</p>` : ""}${
          u.skills
            ? `<div class="skills">${u.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => `<span class="tag b">${s.replace(/</g, "&lt;")}</span>`)
                .join("")}</div>`
            : ""
        }`;
  const profileFormExtras =
    u.role === "faculty"
      ? ""
      : `About me<textarea name="about" rows="3" placeholder="Skills, interests, goals...">${u.about || ""}</textarea>Skills (separate with commas)<input name="skills" value="${u.skills || ""}" placeholder="Python, SQL, Excel, Communication">`;
  const memberId = u.role === "student" ? String(u.id || "").toUpperCase() : u.id;
  return `<h1>My Profile</h1><div class="grid prof"><div class="card c"><label class="upl">${av(u, 1)}<span class="cam">📷</span><input type="file" id="photoIn" accept="image/*" hidden></label>${u.photo ? '<button class="btn out full" id="rmPhoto" style="margin:0 0 8px">Remove Photo</button>' : ""}<h2>${u.name || "Add your name"}</h2><span class="tag b">${u.role.toUpperCase()}</span><p class="mut">${memberId}</p><p class="mut">${escapeHTML(u.email)}</p>${profileSummary}<a class="btn out full" href="#${dash[u.role]}">My Dashboard</a><button class="btn full" style="background:#dc2626" onclick="logout()">🚪 Log Out</button></div>
 <div class="card"><h2>Edit Profile</h2><form id="profForm">Full Name<input name="name" value="${escapeHTML(u.name || "")}" required>${L[0]}<input name="id" id="profileId" value="${escapeHTML(memberId || "")}" required>${L[1]}<input name="contact" value="${escapeHTML(u.contact || "")}" required>${extra}${profileFormExtras}<div class="profile-form-actions"><button class="btn" type="submit">Save Changes</button>${u.role === "faculty" ? '<a class="btn out" href="#activities">View Student Activities</a>' : ""}</div></form>${u.role === "faculty" ? `<hr><h2>Notification Preferences</h2><form id="facultyPreferencesForm"><label><input type="checkbox" name="verificationAlerts" ${u.notificationPreferences?.verificationAlerts !== false ? "checked" : ""}> Verification queue alerts</label><label><input type="checkbox" name="eventAlerts" ${u.notificationPreferences?.eventAlerts !== false ? "checked" : ""}> Upcoming event alerts</label><button class="btn" type="submit">Save preferences</button></form><hr><h2>Change Password</h2><form id="facultyPasswordForm"><label>Current password<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>New password<input name="newPassword" type="password" autocomplete="new-password" minlength="8" required></label><label>Confirm new password<input name="confirmPassword" type="password" autocomplete="new-password" required></label><p id="facultyPasswordMessage" class="mut" role="status" hidden></p><button class="btn" type="submit">Update password</button></form>` : ""}</div></div>${u.role === "student" ? internshipDetails(u) : ""}`;
};

const facultyGate = (title) => getUser()?.role === "faculty" ? "" : `<h1>${escapeHTML(title)}</h1><p class="mut">This page is available to faculty accounts.</p>`;
const facultyPageTitle = (title, description = "") => `<header class="faculty-page-heading"><div><h1>${escapeHTML(title)}</h1>${description ? `<p>${escapeHTML(description)}</p>` : ""}</div><a class="btn out" href="#home">Dashboard</a></header>`;
const updateStoredAccount = (accountId, update) => {
  const accounts = readAccounts();
  const index = accounts.findIndex((account) => account.accountId === accountId);
  if (index < 0) throw new Error("Student account could not be found.");
  accounts[index] = update(accounts[index]);
  writeAccounts(accounts);
};
const renderPostedRows = (internships) => internships.map((internship) => `<tr><td>${escapeHTML(internship.co)}</td><td>${escapeHTML(internship.role)}</td><td>${escapeHTML(internship.yr || "All eligible")}</td><td>${escapeHTML(internship.dur || "Not set")}</td><td>${escapeHTML(internship.pay || "Unpaid")}</td><td>${escapeHTML(internship.loc)}</td><td>${escapeHTML(internship.deadline || "Not set")}</td><td>${escapeHTML(internship.approvalStatus || (internship.approved ? "Approved" : "Pending"))}</td><td><button type="button" class="btn out edit-posting" data-id="${escapeHTML(internship.id)}">Edit</button> <button type="button" class="btn delete-posting" data-id="${escapeHTML(internship.id)}">Delete</button></td></tr>`).join("");

pages.coordinator = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Manage Internships");
  const internships = readPostedInternships();
  return `${facultyPageTitle("Manage Internships", "Create, edit, and close college-provided opportunities.")}<div class="faculty-management-layout"><section class="card faculty-post-card"><h2>Post New Internship</h2><form id="postForm"><input type="hidden" name="internshipId"><div class="post-internship-fields"><label>Company Name<input name="companyName" placeholder="ABC Technologies" required></label><label>Role<input name="role" placeholder="Data Analyst Intern" required></label><label>Location<input name="location" placeholder="Hyderabad or Remote" required></label><label>Stipend (Rs./month)<input name="stipend" type="number" min="0" step="0.01" placeholder="15000" required></label><label>Duration (months)<input name="duration" type="number" min="1" step="1" placeholder="3"></label><label>Application deadline<input name="deadline" type="date" required></label><label>Application link<input name="applicationLink" type="url" placeholder="https://company.com/apply" required></label><fieldset class="eligibility-options"><legend>Eligible branches</legend>${["CSE", "CSD", "CSM", "EEE", "ECE", "Civil", "Mechanical", "IoT", "IT"].map((branch) => `<label><input type="checkbox" name="eligibility" value="${branch}">${branch}</label>`).join("")}</fieldset><a id="applicationLinkPreview" class="application-link-preview" target="_blank" rel="noopener noreferrer" hidden></a><div class="post-form-actions"><button class="btn" type="submit">Publish for review</button><button class="btn out" id="cancelPostEdit" type="button" hidden>Cancel edit</button></div></div></form></section><section class="faculty-management-list"><div class="faculty-section-title"><h2>College internship listings</h2><a class="btn out" href="#approvals">Review queue (${internships.filter((item) => !item.approved && item.approvalStatus !== "rejected").length})</a></div><div class="internship-table-wrap"><table class="internship-table"><thead><tr><th>Company</th><th>Role</th><th>Eligibility</th><th>Duration</th><th>Stipend</th><th>Location</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead><tbody>${renderPostedRows(internships) || '<tr><td colspan="9" class="mut">No college internships have been posted.</td></tr>'}</tbody></table></div></section></div>`;
};

pages.approvals = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Approve College Internships");
  const pending = readPostedInternships().filter((item) => !item.approved && item.approvalStatus !== "rejected");
  return `${facultyPageTitle("Approve College Internships", "Only approved internships appear in student listings.")}<div class="internship-table-wrap"><table class="internship-table"><thead><tr><th>Company</th><th>Role</th><th>Eligibility</th><th>Stipend</th><th>Location</th><th>Deadline</th><th>Review</th></tr></thead><tbody>${pending.map((item) => `<tr><td>${escapeHTML(item.co)}</td><td>${escapeHTML(item.role)}</td><td>${escapeHTML((item.eligibility || []).join(", "))}</td><td>${escapeHTML(item.pay)}</td><td>${escapeHTML(item.loc)}</td><td>${escapeHTML(item.deadline)}</td><td><button class="btn approve-posting" data-id="${escapeHTML(item.id)}">Approve</button> <button class="btn out reject-posting" data-id="${escapeHTML(item.id)}">Reject</button></td></tr>`).join("") || '<tr><td colspan="7" class="mut">No internships are waiting for approval.</td></tr>'}</tbody></table></div>`;
};

const originalVerifyPage = pages.verify;
pages.verify = () => {
  if (getUser()?.role !== "faculty") return originalVerifyPage();
  const pending = readAccounts().filter((account) => account.role === "student").flatMap((student) =>
    internshipList(student).map((internship, index) => ({ student, internship, index })),
  ).filter(({ internship }) => !internship.verified && internship.verificationStatus !== "rejected");
  return `${facultyPageTitle("Verify Student Records", "Review student-reported internships and update their verification status.")}<div class="internship-table-wrap"><table class="internship-table"><thead><tr><th>Student</th><th>Roll Number</th><th>Branch / Year</th><th>Internship</th><th>Company</th><th>Duration</th><th>Stipend</th><th>Action</th></tr></thead><tbody>${pending.map(({ student, internship, index }) => `<tr><td>${escapeHTML(student.name || "Student")}</td><td>${escapeHTML(student.id || "Not set")}</td><td>${escapeHTML([student.branch, student.year].filter(Boolean).join(" / ") || "Not set")}</td><td>${escapeHTML(internship.internshipName || "Not set")}</td><td>${escapeHTML(internship.companyName || "Not set")}</td><td>${escapeHTML(internship.durationMonths || "Not set")} months</td><td>${escapeHTML(internship.payment ?? "Not set")}</td><td><button class="btn verify-record" data-account="${escapeHTML(student.accountId)}" data-index="${index}">Approve</button> <button class="btn out reject-record" data-account="${escapeHTML(student.accountId)}" data-index="${index}">Reject</button></td></tr>`).join("") || '<tr><td colspan="8" class="mut">No student records are waiting for review.</td></tr>'}</tbody></table></div><p class="mut">This browser-only app reviews internship records saved in student profiles; uploaded documents are not stored.</p>`;
};

pages.students = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Student Records");
  const students = readAccounts().filter((account) => account.role === "student");
  const rows = students.map((student) => {
    const records = internshipList(student);
    return `<tr data-search="${escapeHTML([student.name, student.id, student.branch, student.year].join(" ").toLowerCase())}" data-branch="${escapeHTML(student.branch || "")}" data-year="${escapeHTML(student.year || "")}"><td>${escapeHTML(student.name || "Student")}</td><td>${escapeHTML(student.id || "Not set")}</td><td>${escapeHTML(student.branch || "Not set")}</td><td>${escapeHTML(student.year || "Not set")}</td><td>${records.length}</td><td>${records.filter((record) => record.verified).length} verified / ${records.filter((record) => !record.verified).length} pending</td><td><button class="btn out view-student-history" data-account="${escapeHTML(student.accountId)}">View history</button></td></tr>`;
  }).join("");
  const branches = [...new Set(students.map((student) => student.branch).filter(Boolean))].sort();
  return `${facultyPageTitle("Student Records", "Search profiles, branches, years, and internship history.")}<form id="studentDirectorySearch" class="faculty-filter-bar"><input id="studentDirectoryQuery" type="search" placeholder="Name, roll number, branch..." aria-label="Search students"><select id="studentDirectoryBranch"><option value="">All branches</option>${branches.map((branch) => `<option>${escapeHTML(branch)}</option>`).join("")}</select><select id="studentDirectoryYear"><option value="">All years</option>${["1st Year", "2nd Year", "3rd Year", "4th Year"].map((year) => `<option>${year}</option>`).join("")}</select><button class="btn" type="submit">Filter</button></form><div class="internship-table-wrap"><table class="internship-table" id="studentDirectoryTable"><thead><tr><th>Student</th><th>Roll Number</th><th>Branch</th><th>Year</th><th>Internships</th><th>Verification</th><th>History</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="mut">No student accounts have registered.</td></tr>'}</tbody></table></div>`;
};

pages["student-history"] = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Student History");
  const student = readAccounts().find((account) => account.accountId === sessionStorage.getItem("collegeInternshipHub.studentRecord"));
  if (!student) return `${facultyPageTitle("Student History")}<p class="mut">Select a student from the records list.</p>`;
  const records = internshipList(student);
  return `${facultyPageTitle(student.name || "Student History", `${student.id || "No roll number"} · ${[student.branch, student.year].filter(Boolean).join(" / ") || "No department details"}`)}<div class="internship-table-wrap"><table class="internship-table"><thead><tr><th>Internship</th><th>Company</th><th>Duration</th><th>Stipend</th><th>Status</th><th>Verification</th></tr></thead><tbody>${records.map((record) => `<tr><td>${escapeHTML(record.internshipName || "Not set")}</td><td>${escapeHTML(record.companyName || "Not set")}</td><td>${escapeHTML(record.durationMonths || "Not set")}</td><td>${escapeHTML(record.payment ?? "Not set")}</td><td>${escapeHTML(record.status || "Completed")}</td><td>${record.verified ? "Verified" : escapeHTML(record.verificationStatus || "Pending")}</td></tr>`).join("") || '<tr><td colspan="6" class="mut">No internship history has been added.</td></tr>'}</tbody></table></div>`;
};

pages["verified-records"] = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Verified Records");
  const records = readAccounts().filter((account) => account.role === "student").flatMap((student) => internshipList(student).filter((internship) => internship.verified).map((internship) => ({ student, internship })));
  return `${facultyPageTitle("Verified Internship Records")}<div class="internship-table-wrap"><table class="internship-table"><thead><tr><th>Student</th><th>Roll Number</th><th>Branch / Year</th><th>Internship</th><th>Company</th><th>Status</th></tr></thead><tbody>${records.map(({ student, internship }) => `<tr><td>${escapeHTML(student.name || "Student")}</td><td>${escapeHTML(student.id || "Not set")}</td><td>${escapeHTML([student.branch, student.year].filter(Boolean).join(" / ") || "Not set")}</td><td>${escapeHTML(internship.internshipName || "Not set")}</td><td>${escapeHTML(internship.companyName || "Not set")}</td><td>Verified</td></tr>`).join("") || '<tr><td colspan="6" class="mut">No verified student records.</td></tr>'}</tbody></table></div>`;
};

pages.analytics = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Reports & Analytics");
  const students = readAccounts().filter((account) => account.role === "student");
  const records = students.flatMap((student) => internshipList(student).map((internship) => ({ student, internship })));
  const branches = [...new Set(students.map((student) => student.branch).filter(Boolean))].sort();
  const stats = [["Students", students.length], ["Internship records", records.length], ["Verified", records.filter(({ internship }) => internship.verified).length], ["Students without records", students.filter((student) => !internshipList(student).length).length]];
  return `${facultyPageTitle("Reports & Analytics", "Live summaries from registered student profiles and internship records.")}<div class="grid g4 faculty-analytics-stats">${stats.map(([label, value]) => `<div class="card"><div class="mut">${label}</div><div class="stat">${value}</div></div>`).join("")}</div><div class="faculty-report-grid"><section class="faculty-panel"><h2>Participation by branch</h2>${branches.map((branch) => { const count = students.filter((student) => student.branch === branch && internshipList(student).length).length; const total = students.filter((student) => student.branch === branch).length; const percent = total ? Math.round(count / total * 100) : 0; return `<div class="faculty-report-row"><span>${escapeHTML(branch)}</span><div><i style="width:${percent}%"></i></div><b>${percent}%</b></div>`; }).join("") || '<p class="faculty-empty">Add student branch details to view participation.</p>'}</section><section class="faculty-panel"><h2>Paid vs unpaid</h2>${[["Paid", records.filter(({ internship }) => (paymentAmount(internship.payment) || 0) > 0).length], ["Unpaid / not set", records.filter(({ internship }) => !(paymentAmount(internship.payment) > 0)).length], ["Remote", records.filter(({ internship }) => /remote/i.test(internship.location || "")).length]].map(([label, count]) => `<div class="faculty-report-row"><span>${label}</span><b>${count}</b></div>`).join("")}<a class="btn out" href="#students">View student records</a></section></div><button class="btn out" id="downloadStudentReport" type="button">Download CSV report</button>`;
};

pages.announcements = () => {
  const user = getUser();
  if (user?.role === "student") {
    const today = new Date().toISOString().slice(0, 10);
    const audienceMatches = (audience) => ["All students", user.branch, user.year, `${user.branch || ""} ${user.year || ""}`.trim()].some((target) => target && target.toLowerCase() === String(audience || "").toLowerCase());
    const visible = readLocalList(facultyAnnouncementsKey).filter((item) => audienceMatches(item.audience) && (!item.expiryDate || item.expiryDate >= today));
    return `<h1>Announcements</h1><div class="grid">${visible.map((item) => `<article class="card"><b>${escapeHTML(item.title)}</b><p>${escapeHTML(item.message)}</p><small class="mut">${escapeHTML(item.audience || "All students")} · ${escapeHTML(item.date || "Published")}</small></article>`).join("") || '<p class="mut">No current announcements for your department.</p>'}</div>`;
  }
  if (user?.role !== "faculty") return facultyGate("Announcements");
  const announcements = readLocalList(facultyAnnouncementsKey);
  return `${facultyPageTitle("Announcements", "Publish targeted updates for students.")}<div class="faculty-management-layout"><section class="card faculty-post-card"><h2 id="announcementFormHeading">Create announcement</h2><form id="announcementForm"><input type="hidden" name="id"><label>Title<input name="title" required maxlength="100"></label><label>Message<textarea name="message" rows="4" required maxlength="600"></textarea></label><div class="post-internship-fields"><label>Audience<select name="audience"><option>All students</option><option>CSE</option><option>ECE</option><option>EEE</option><option>IT</option><option>3rd Year</option><option>CSE 3rd Year</option></select></label><label>Expiry date<input name="expiryDate" type="date"></label></div><div class="post-form-actions"><button class="btn" type="submit">Publish announcement</button><button class="btn out" id="cancelAnnouncementEdit" type="button" hidden>Cancel edit</button></div></form></section><section class="faculty-management-list"><h2>Published announcements</h2>${announcements.map((item) => `<article class="faculty-list-item"><div><b>${escapeHTML(item.title)}</b><p>${escapeHTML(item.message)}</p><small>${escapeHTML(item.audience || "All students")} · Published ${escapeHTML(item.date || "today")}${item.expiryDate ? ` · Expires ${escapeHTML(item.expiryDate)}` : ""}</small></div><div><button class="btn out edit-announcement" data-id="${escapeHTML(item.id)}">Edit</button> <button class="btn delete-announcement" data-id="${escapeHTML(item.id)}">Delete</button></div></article>`).join("") || '<p class="faculty-empty">No announcements have been published.</p>'}</section></div>`;
};

pages.events = () => {
  const user = getUser();
  if (user?.role === "student") {
    const today = new Date().toISOString().slice(0, 10);
    const visible = readLocalList(facultyEventsKey).filter((event) => event.date >= today && ["All students", user.branch, user.year].some((target) => target && target.toLowerCase() === String(event.audience || "").toLowerCase())).sort((a, b) => a.date.localeCompare(b.date));
    return `<h1>Upcoming Events</h1><div class="grid">${visible.map((event) => `<article class="card"><b>${escapeHTML(event.title)}</b><p class="mut">${escapeHTML(event.type || "Event")} · ${escapeHTML(event.audience || "All students")}</p><small class="mut">${escapeHTML(event.date)} ${escapeHTML(event.time || "")}</small></article>`).join("") || '<p class="mut">No upcoming events for your department.</p>'}</div>`;
  }
  if (user?.role !== "faculty") return facultyGate("Upcoming Events");
  const events = readLocalList(facultyEventsKey).sort((a, b) => a.date.localeCompare(b.date));
  return `${facultyPageTitle("Upcoming Events", "Manage sessions, deadlines, drives, and faculty events.")}<div class="faculty-management-layout"><section class="card faculty-post-card"><h2 id="eventFormHeading">Add event</h2><form id="eventForm"><input type="hidden" name="id"><label>Event title<input name="title" required maxlength="100"></label><div class="post-internship-fields"><label>Date<input name="date" type="date" required></label><label>Time<input name="time" type="time"></label><label>Audience<select name="audience"><option>All students</option><option>CSE</option><option>ECE</option><option>EEE</option><option>3rd Year</option></select></label><label>Type<select name="type"><option>Information session</option><option>Application deadline</option><option>Document deadline</option><option>Placement drive</option><option>Faculty meeting</option></select></label></div><div class="post-form-actions"><button class="btn" type="submit">Save event</button><button class="btn out" id="cancelEventEdit" type="button" hidden>Cancel edit</button></div></form></section><section class="faculty-management-list"><h2>Scheduled events</h2>${events.map((event) => `<article class="faculty-list-item"><div><b>${escapeHTML(event.title)}</b><p>${escapeHTML(event.type || "Event")} · ${escapeHTML(event.audience || "All students")}</p><small>${escapeHTML(event.date)} ${escapeHTML(event.time || "")}</small></div><div><button class="btn out edit-event" data-id="${escapeHTML(event.id)}">Edit</button> <button class="btn delete-event" data-id="${escapeHTML(event.id)}">Delete</button></div></article>`).join("") || '<p class="faculty-empty">No events have been scheduled.</p>'}</section></div>`;
};

pages.coordinators = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Manage Coordinators");
  const coordinators = readLocalList("collegeInternshipHub.coordinators");
  return `${facultyPageTitle("Manage Coordinators", "Assign department and verification responsibilities.")}<section class="card faculty-post-card"><form id="coordinatorForm" class="faculty-inline-form"><label>Coordinator name<input name="name" required></label><label>Department / responsibility<input name="responsibility" placeholder="CSE · Document review" required></label><button class="btn" type="submit">Assign coordinator</button></form></section><div class="faculty-management-list">${coordinators.map((item) => `<article class="faculty-list-item"><div><b>${escapeHTML(item.name)}</b><small>${escapeHTML(item.responsibility)}</small></div><button class="btn delete-coordinator" data-id="${escapeHTML(item.id)}">Remove</button></article>`).join("") || '<p class="faculty-empty">No coordinators assigned yet.</p>'}</div>`;
};

pages.directory = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Company Directory");
  const companyRecords = readLocalList("collegeInternshipHub.companyDirectory");
  const companies = new Map();
  companyRecords.forEach((record) => companies.set(record.name.toLowerCase(), { ...record, roles: new Set(), count: 0 }));
  for (const internship of readPostedInternships()) {
    const name = String(internship.co || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const company = companies.get(key) || { name, roles: new Set(), count: 0 };
    company.roles.add(internship.role);
    company.count += 1;
    companies.set(key, company);
  }
  const items = [...companies.values()].sort((a, b) => a.name.localeCompare(b.name));
  return `${facultyPageTitle("Company & Internship Directory", "Manage partner details and browse college internship history.")}<section class="card faculty-post-card"><h2 id="companyFormHeading">Add company details</h2><form id="companyDirectoryForm" class="faculty-inline-form"><input type="hidden" name="id"><label>Company name<input name="name" required></label><label>Website<input name="website" type="url" placeholder="https://company.com"></label><label>Industry<input name="industry" placeholder="Technology"></label><label>Contact person<input name="contact" placeholder="Name or email"></label><div class="post-form-actions"><button class="btn" type="submit">Save company</button><button class="btn out" id="cancelCompanyEdit" type="button" hidden>Cancel edit</button></div></form></section><form id="directorySearch" class="faculty-filter-bar"><input id="directoryQuery" type="search" placeholder="Search company or role"></form><div class="faculty-directory-grid">${items.map((company) => `<article class="faculty-panel directory-company" data-search="${escapeHTML(`${company.name} ${[...company.roles].join(" ")} ${company.industry || ""}`.toLowerCase())}"><span>▦</span><h2>${escapeHTML(company.name)}</h2><p>${[...company.roles].map(escapeHTML).join(", ") || escapeHTML(company.industry || "Industry not set")}</p><small>${company.count} college posting${company.count === 1 ? "" : "s"}${company.contact ? ` · Contact: ${escapeHTML(company.contact)}` : ""}</small>${company.website ? `<a href="${escapeHTML(company.website)}" target="_blank" rel="noopener noreferrer">Company website ↗</a>` : ""}${company.id ? `<div><button class="btn out edit-company" data-id="${escapeHTML(company.id)}">Edit</button> <button class="btn delete-company" data-id="${escapeHTML(company.id)}">Delete</button></div>` : ""}</article>`).join("") || '<p class="faculty-empty">Companies will appear here when internships are posted.</p>'}</div>`;
};

pages["faculty-search"] = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Search");
  const rawQuery = sessionStorage.getItem("collegeInternshipHub.facultySearch") || "";
  const query = rawQuery.toLowerCase();
  const students = readAccounts().filter((account) => account.role === "student" && [account.name, account.id, account.branch, account.year].join(" ").toLowerCase().includes(query));
  const internships = readPostedInternships().filter((item) => [item.co, item.role, item.loc, item.yr].join(" ").toLowerCase().includes(query));
  return `${facultyPageTitle("Global Search", "Search students and college internship listings.")}<form id="facultyGlobalSearch" class="faculty-filter-bar"><input name="query" value="${escapeHTML(rawQuery)}" placeholder="Student, roll number, company, role..."><button class="btn">Search</button></form><div class="faculty-search-results"><section class="faculty-panel"><h2>Students (${students.length})</h2>${students.map((student) => `<a class="faculty-search-result view-student-history" href="#student-history" data-account="${escapeHTML(student.accountId)}"><b>${escapeHTML(student.name || "Student")}</b><small>${escapeHTML(student.id || "No roll number")} · ${escapeHTML([student.branch, student.year].filter(Boolean).join(" / "))}</small></a>`).join("") || '<p class="faculty-empty">No matching students.</p>'}</section><section class="faculty-panel"><h2>Internships (${internships.length})</h2>${internships.map((item) => `<div class="faculty-search-result"><b>${escapeHTML(item.role)}</b><small>${escapeHTML(item.co)} · ${escapeHTML(item.loc)} · ${escapeHTML(item.approvalStatus || "Pending")}</small></div>`).join("") || '<p class="faculty-empty">No matching internships.</p>'}</section></div>`;
};

pages.notifications = () => {
  if (getUser()?.role !== "faculty") return facultyGate("Notifications");
  const records = readAccounts().filter((account) => account.role === "student").flatMap((student) => internshipList(student).filter((item) => !item.verified && item.verificationStatus !== "rejected").map((item) => ({ text: `${student.name || student.id}: ${item.internshipName || "Internship record"} awaiting verification`, route: "verify" })));
  const posts = readPostedInternships().filter((item) => !item.approved && item.approvalStatus !== "rejected").map((item) => ({ text: `${item.co}: ${item.role} waiting for approval`, route: "approvals" }));
  return `${facultyPageTitle("Notifications")}<div class="faculty-management-list">${[...records, ...posts].map((item) => `<a class="faculty-list-item" href="#${item.route}"><b>${escapeHTML(item.text)}</b><span>Open →</span></a>`).join("") || '<p class="faculty-empty">No new notifications.</p>'}</div>`;
};

pages.about = () => `<section class="faculty-panel faculty-about"><span class="faculty-eyebrow">R.V.R. & J.C. COLLEGE OF ENGINEERING</span><h1>College Internship Hub</h1><p>Connect students with verified internship opportunities, track student experience, and support the review process through faculty and coordinators.</p><h2>Verification process</h2><p>Student internship records and college-provided opportunities are reviewed by faculty before being marked verified or published to students.</p><a class="btn out" href="#home">Faculty dashboard</a></section>`;
pages.support = () => `<section class="faculty-panel faculty-about"><h1>Help & Support</h1><p>For account access or password resets, contact the college administrator. For platform issues, contact your department coordinator.</p><a class="btn out" href="#profile">Faculty profile</a></section>`;

function logout() {
  localStorage.removeItem(currentAccountKey);
  renderNav();
  location.hash = "home";
  route();
}
function renderNav() {
  const u = getUser();
  const nav = document.getElementById("links");
  document.body.classList.toggle("faculty-session", u?.role === "faculty");
  const links = u?.role === "faculty"
    ? '<a href="#home">Home</a><a href="#coordinator">Internships</a><a href="#students">Students</a><a href="#home">Faculty</a><a href="#about">About</a><a href="#faculty-search" aria-label="Search">⌕ Search</a><a href="#notifications" aria-label="Notifications">♧</a>'
    : u?.role === "student"
      ? '<a href="#home">Home</a><a href="#college-internships">Internships</a><a href="#announcements">Announcements</a><a href="#events">Events</a>'
      : '<a href="#home">Home</a>';
  nav.innerHTML = `${links}<span id="authArea"></span>`;
  const a = document.getElementById("authArea");
  a.innerHTML = u
    ? `<span class="pm"><button class="pbtn" id="pBtn">${av(u)}${u.name || u.id}</button><span class="pdrop" id="pDrop"><a href="#profile">👤 My Profile</a><a href="#${dash[u.role]}">📊 My Dashboard</a><a href="#" id="loBtn">🚪 Log Out</a></span></span>`
    : '<a href="#login">Login</a>';
  if (u) {
    document.getElementById("pBtn").onclick = (e) => {
      e.stopPropagation();
      document.getElementById("pDrop").classList.toggle("open");
    };
    document.getElementById("loBtn").onclick = (e) => {
      e.preventDefault();
      logout();
    };
  }
}
document.addEventListener("click", () => {
  const d = document.getElementById("pDrop");
  d && d.classList.remove("open");
});
document.addEventListener("submit", (e) => {
  if (!e.target.matches("#profForm")) return;
  e.preventDefault();
  const changes = Object.fromEntries(new FormData(e.target));
  if (getUser()?.role === "student")
    changes.id = String(changes.id || "").trim().toUpperCase();
  updateProfile(changes)
    .then(() => {
      renderNav();
      alert("Profile updated");
      route();
    })
    .catch(showFailure);
});

const app = document.getElementById("app");
document.addEventListener("click", (event) => {
  const control = event.target.closest("button, .btn, a.card, .role, .tabs span, .side a");
  if (!control || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const bounds = control.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "clickable-ripple";
  ripple.style.left = `${event.clientX ? event.clientX - bounds.left : bounds.width / 2}px`;
  ripple.style.top = `${event.clientY ? event.clientY - bounds.top : bounds.height / 2}px`;
  control.append(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
});

function bind() {
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const profileId = $("#profileId");
  if (profileId && getUser()?.role === "student")
    profileId.oninput = () => {
      profileId.value = profileId.value.toUpperCase();
    };
  const facultyPreferencesForm = $("#facultyPreferencesForm");
  if (facultyPreferencesForm)
    facultyPreferencesForm.onsubmit = async (event) => {
      event.preventDefault();
      try {
        await updateProfile({
          notificationPreferences: {
            verificationAlerts: facultyPreferencesForm.elements.verificationAlerts.checked,
            eventAlerts: facultyPreferencesForm.elements.eventAlerts.checked,
          },
        });
        route();
      } catch (error) {
        showFailure(error);
      }
    };
  const facultyPasswordForm = $("#facultyPasswordForm");
  if (facultyPasswordForm)
    facultyPasswordForm.onsubmit = async (event) => {
      event.preventDefault();
      const user = getUser();
      const message = $("#facultyPasswordMessage");
      message.className = "mut";
      message.hidden = false;
      const storedAccount = readAccounts().find((account) => account.accountId === user?.accountId);
      if (!storedAccount?.passwordHash || !(await verifyPassword(facultyPasswordForm.elements.currentPassword.value, storedAccount))) {
        message.textContent = "Current password is incorrect.";
        message.classList.add("field-error");
        return;
      }
      const newPassword = facultyPasswordForm.elements.newPassword.value;
      if (newPassword.length < 8) {
        message.textContent = "New password must contain at least 8 characters.";
        message.classList.add("field-error");
        return;
      }
      if (newPassword !== facultyPasswordForm.elements.confirmPassword.value) {
        message.textContent = "New passwords do not match.";
        message.classList.add("field-error");
        return;
      }
      try {
        await updateProfile(await createPasswordRecord(newPassword));
        message.className = "auth-success";
        message.textContent = "Password updated successfully.";
        facultyPasswordForm.reset();
      } catch (error) {
        message.textContent = error?.message || "Password could not be updated.";
        message.classList.add("field-error");
      }
    };
  const tl = $("#tl");
  if (tl) {
    const setFieldError = (fieldId, messageId, message) => {
      const field = $(`#${fieldId}`);
      const error = $(`#${messageId}`);
      field.classList.toggle("input-invalid", Boolean(message));
      field.setAttribute("aria-invalid", String(Boolean(message)));
      error.textContent = message;
      error.hidden = !message;
    };
    const clearFieldErrors = () => {
      for (const [fieldId, messageId] of [
        ["signupName", "signupNameError"],
        ["signupMemberId", "signupMemberIdError"],
        ["authEmail", "authEmailError"],
        ["loginPassword", "loginPasswordError"],
        ["confirmPassword", "confirmPasswordError"],
      ])
        setFieldError(fieldId, messageId, "");
    };
    const updateIdentifierField = () => {
      const role = $('input[name="role"]:checked').value;
      const signup = $("#ts").classList.contains("on");
      const isStudent = role === "student";
      const idLabel = role === "faculty" ? "Faculty ID" : "Verification ID";
      $("#authEmail").type = signup ? "email" : "text";
      $("#authEmail").placeholder = signup
        ? isStudent ? "Roll number email (e.g. y23ec013@rvrjc.ac.in)" : "Email address"
        : isStudent ? "Student roll number" : idLabel;
      $("#authEmail").autocomplete = signup ? "email" : "username";
      $("#signupMemberId").placeholder = isStudent
        ? "Roll Number (e.g. Y23EC013 or L24EC199)"
        : idLabel;
      $("#signupContact").hidden = isStudent;
      if (isStudent && signup)
        $("#signupMemberId").value = $("#signupMemberId").value.toUpperCase();
    };
    const setMode = (signup) => {
      $("#ts").classList.toggle("on", signup);
      tl.classList.toggle("on", !signup);
      $("#roles").hidden = false;
      $("#signupFields").hidden = !signup;
      $("#signupName").required = signup;
      $("#signupMemberId").required = signup;
      $("#authSubmit").textContent = signup ? "Create account" : "Login";
      $("#loginPassword").autocomplete = signup ? "new-password" : "current-password";
      $("#confirmField").hidden = !signup;
      $("#confirmPassword").required = signup;
      $("#signupPrompt").hidden = signup;
      $("#forgotPasswordSection").hidden = signup;
      $("#forgotPasswordInfo").hidden = true;
      $("#authError").hidden = true;
      $("#authSuccess").hidden = true;
      clearFieldErrors();
      updateIdentifierField();
    };
    setMode(false);
    $("#ts").onclick = () => setMode(true);
    tl.onclick = () => setMode(false);
    $("#signupPromptLink").onclick = (event) => {
      event.preventDefault();
      setMode(true);
    };
    $("#forgotPasswordBtn").onclick = () => {
      $("#forgotPasswordInfo").hidden = !$("#forgotPasswordInfo").hidden;
    };
    $$(".role input").forEach(
      (r) =>
        (r.onchange = () => {
          $$(".role").forEach((l) => l.classList.remove("on"));
          r.parentElement.classList.add("on");
          updateIdentifierField();
        }),
    );
    $("#signupMemberId").oninput = () => {
      if ($('input[name="role"]:checked').value === "student" && $("#ts").classList.contains("on"))
        $("#signupMemberId").value = $("#signupMemberId").value.toUpperCase();
      setFieldError("signupMemberId", "signupMemberIdError", "");
    };
    $("#signupName").oninput = () => setFieldError("signupName", "signupNameError", "");
    $("#authEmail").oninput = () => {
      if ($('input[name="role"]:checked').value === "student" && $("#ts").classList.contains("on"))
        $("#authEmail").value = $("#authEmail").value.toLowerCase();
      setFieldError("authEmail", "authEmailError", "");
    };
    $("#loginPassword").oninput = () => setFieldError("loginPassword", "loginPasswordError", "");
    $("#confirmPassword").oninput = () => setFieldError("confirmPassword", "confirmPasswordError", "");
    $("#loginForm").onsubmit = async (e) => {
      e.preventDefault();
      const signup = $("#ts").classList.contains("on");
      const role = $('input[name="role"]:checked').value;
      const isStudent = role === "student";
      const rollNumber = $("#signupMemberId").value.trim().toUpperCase();
      const identifier = $("#authEmail").value.trim();
      const email = identifier.toLowerCase();
      const password = $("#loginPassword").value;
      clearFieldErrors();
      $("#authError").hidden = true;
      let valid = true;
      const fieldError = (fieldId, messageId, message) => {
        setFieldError(fieldId, messageId, message);
        valid = false;
      };
      if (signup) {
        if (!$("#signupName").value.trim())
          fieldError("signupName", "signupNameError", "Enter your full name.");
        if (!$("#signupMemberId").value.trim())
          fieldError("signupMemberId", "signupMemberIdError", isStudent ? "Enter your student roll number." : "Enter your ID.");
        else if (isStudent && !studentRollPattern.test(rollNumber))
          fieldError("signupMemberId", "signupMemberIdError", "Enter a valid roll number, e.g. Y23EC013 or L24EC199.");
        if (!identifier)
          fieldError("authEmail", "authEmailError", "Enter your email address.");
        else if (isStudent && studentRollPattern.test(rollNumber) && email !== `${rollNumber.toLowerCase()}@rvrjc.ac.in`)
          fieldError("authEmail", "authEmailError", `Enter ${rollNumber.toLowerCase()}@rvrjc.ac.in for this roll number.`);
        else if (!isStudent && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          fieldError("authEmail", "authEmailError", "Enter a valid email address.");
        if (!password)
          fieldError("loginPassword", "loginPasswordError", "Enter a password.");
        if (!$("#confirmPassword").value)
          fieldError("confirmPassword", "confirmPasswordError", "Confirm your password.");
        else if (password !== $("#confirmPassword").value)
          fieldError("confirmPassword", "confirmPasswordError", "Passwords do not match.");
      } else {
        if (!identifier)
          fieldError("authEmail", "authEmailError", isStudent ? "Enter your student roll number." : "Enter your login ID.");
        else if (isStudent && !studentRollPattern.test(identifier.toUpperCase()))
          fieldError("authEmail", "authEmailError", "Enter a valid roll number, e.g. Y23EC013 or L24EC199.");
        if (!password)
          fieldError("loginPassword", "loginPasswordError", "Enter your password.");
      }
      if (!valid) return;
      const submitButton = $("#authSubmit");
      submitButton.disabled = true;
      $("#authSuccess").hidden = true;
      try {
        const accounts = readAccounts();
        if (signup) {
          if (accounts.some((account) => String(account.email || "").toLowerCase() === email)) {
            fieldError("authEmail", "authEmailError", "An account with this email already exists. Please log in.");
            return;
          }
          if (role === "student" && accounts.some((account) =>
            account.role === "student" && String(account.id || "").trim().toUpperCase() === rollNumber
          )) {
            fieldError("signupMemberId", "signupMemberIdError", "An account with this roll number already exists. Please log in.");
            return;
          }
          if (role !== "student" && accounts.some((account) =>
            account.role === role && String(account.id || "").trim().toLowerCase() === $("#signupMemberId").value.trim().toLowerCase()
          )) {
            throw new Error(`An account with this ${role === "admin" ? "Verification ID" : "Faculty ID"} already exists. Please log in.`);
          }
          const passwordRecord = await createPasswordRecord(password);
          const account = {
            accountId: crypto.randomUUID(),
            role,
            email,
            name: $("#signupName").value.trim(),
            id: role === "student"
              ? rollNumber
              : $("#signupMemberId").value.trim(),
            contact: role === "student" ? "" : $("#signupContact").value.trim(),
            branch: "",
            year: "",
            dept: "",
            about: "",
            skills: "",
            photo: "",
            internships: [],
            ...passwordRecord,
          };
          accounts.push(account);
          writeAccounts(accounts);
          if (role === "student") addFacultyActivity(`New student registered: ${account.name}`, "students");
          localStorage.removeItem(currentAccountKey);
          renderNav();
          $("#authEmail").value = role === "student" ? rollNumber : "";
          $("#loginPassword").value = "";
          $("#confirmPassword").value = "";
          $("#signupName").value = "";
          $("#signupMemberId").value = "";
          $("#signupContact").value = "";
          setMode(false);
          $("#authSuccess").textContent = role === "student"
            ? "Account created successfully. Log in with your roll number and password."
            : `Account created successfully. Log in with your ${role === "admin" ? "Verification ID" : "Faculty ID"} and password.`;
          $("#authSuccess").hidden = false;
          return;
        } else {
          const account = role !== "student"
            ? accounts.find((item) => item.role === role && String(item.id || "").trim().toLowerCase() === identifier.toLowerCase())
            : accounts.find((item) => item.role === role && String(item.id || "").trim().toUpperCase() === identifier.toUpperCase());
          if (!account && isStudent) {
            fieldError("authEmail", "authEmailError", "No student account was found for this roll number.");
            return;
          }
          if (!account || !(await verifyPassword(password, account)))
            throw new Error(role === "student" ? "Roll number or password is incorrect." : `${role === "admin" ? "Verification ID" : "Faculty ID"} or password is incorrect.`);
          localStorage.setItem(currentAccountKey, account.accountId || account.id);
        }
        location.hash = "home";
        route();
      } catch (error) {
        showFailure(error);
      } finally {
        if (submitButton.isConnected) submitButton.disabled = false;
      }
    };
  }
  if ($("#list")) {
    const run = () => {
      const q = $("#q").value.toLowerCase(),
        ys = $$(".f:checked").map((x) => x.value),
        ts = $$(".t:checked").map((x) => x.value);
      $("#list").innerHTML =
        jobs
          .map((job, index) => ({ job, index }))
          .filter(
            ({ job }) =>
              (job.role + job.co + job.skills).toLowerCase().includes(q) &&
              (!ys.length || ys.some((y) => job.yr.includes(y))) &&
              (!ts.length || ts.some((t) => (job.src || "College Source").includes(t))),
          )
          .map(({ job, index }) => jobCard(job, index))
          .join("") || '<p class="mut">No results</p>';
    };
    $("#q").oninput = run;
    $$(".f,.t").forEach((c) => (c.onchange = run));
  }
  [
    {
      form: $("#postedSearchForm"),
      search: $("#postedSearch"),
      location: $("#postedLocation"),
      list: $("#postedJobList"),
      count: $("#postedResultCount"),
      emptyId: "postedNoResults",
    },
    {
      form: $("#selfFoundSearchForm"),
      search: $("#selfFoundSearch"),
      location: $("#selfFoundLocation"),
      list: $("#selfFoundJobList"),
      count: $("#selfFoundResultCount"),
      emptyId: "selfFoundNoResults",
    },
  ].filter((listing) => listing.form).forEach(({ form, search, location, list, count, emptyId }) => {
    const postedJobs = [...list.querySelectorAll(".posted-job")];
    const filterPostedJobs = () => {
      const query = search.value.trim().toLowerCase();
      const locationQuery = location.value.trim().toLowerCase();
      let visibleCount = 0;
      postedJobs.forEach((job) => {
        const isVisible = job.dataset.search.includes(query) && job.dataset.location.includes(locationQuery);
        job.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });
      count.textContent = `${visibleCount} ${visibleCount === 1 ? "job" : "jobs"}`;
      let emptyMessage = $(`#${emptyId}`);
      if (!visibleCount && postedJobs.length) {
        if (!emptyMessage) {
          list.insertAdjacentHTML("beforeend", `<div class="posted-empty" id="${emptyId}">No internships match your search.</div>`);
          emptyMessage = $(`#${emptyId}`);
        }
        emptyMessage.hidden = false;
      } else if (emptyMessage) {
        emptyMessage.hidden = true;
      }
    };
    form.onsubmit = (event) => event.preventDefault();
    search.oninput = filterPostedJobs;
    location.oninput = filterPostedJobs;
  });
  if ($("#dt")) {
    const t = {
      Overview:
        "Work on real-time data analytics projects and gain hands-on experience with industry tools and datasets.",
      "How I Got It": "Source: College Coordinator.",
      "Selection Process":
        "Resume Shortlisting → Aptitude Test → Technical Interview → HR Interview",
      Skills: "SQL, Excel, Power BI",
      Preparation: "SQL basics, Excel practice, previous projects",
      Advice: "Keep improving your technical skills and be consistent.",
    };
    $$("#dt span").forEach(
      (s) =>
        (s.onclick = () => {
          $$("#dt span").forEach((x) => x.classList.remove("on"));
          s.classList.add("on");
          $("#dtc").innerHTML =
            `<b>${s.textContent}</b><p class="mut">${t[s.textContent]}</p>`;
        }),
    );
  }
  const ab = $("#askBtn");
  if (ab)
    ab.onclick = () => {
      const v = $("#aq").value.trim();
      if (v) {
        $("#qs").insertAdjacentHTML(
          "afterbegin",
          `<div class="card" style="margin-top:12px"><b>❓ ${v.replace(/</g, "&lt;")}</b><div class="mut">You · just now</div><p class="mut">Waiting for a senior to answer...</p></div>`,
        );
        $("#aq").value = "";
      }
    };
  $$(".ap").forEach(
    (b) =>
      (b.onclick = () => {
        b.closest("tr").remove();
      }),
  );
  $$(".del").forEach((b) => (b.onclick = () => b.closest("tr").remove()));
  const ac = $("#addCo");
  if (ac)
    ac.onclick = () => {
      const n = prompt("Company name?");
      if (n)
        $("#ct").insertAdjacentHTML(
          "beforeend",
          `<tr><td>${n.replace(/</g, "&lt;")}</td><td>College</td><td><button class="btn out">Edit</button> <button class="btn del" style="background:#dc2626" onclick="this.closest('tr').remove()">Delete</button></td></tr>`,
        );
    };
  const selfFoundForm = $("#selfFoundForm");
  if (selfFoundForm) {
    const eligibilityFields = [...selfFoundForm.querySelectorAll('input[name="eligibility"]')];
    const requiredFields = ["companyName", "role", "location", "deadline", "applicationLink"];
    const updateEligibilityValidity = () => {
      eligibilityFields[0].setCustomValidity(
        eligibilityFields.some((field) => field.checked) ? "" : "Select at least one eligible branch.",
      );
    };
    eligibilityFields.forEach((field) => {
      field.onchange = updateEligibilityValidity;
    });
    requiredFields.forEach((name) => {
      selfFoundForm.elements[name].addEventListener("input", () => selfFoundForm.elements[name].setCustomValidity(""));
    });
    selfFoundForm.onsubmit = async (event) => {
      event.preventDefault();
      updateEligibilityValidity();
      requiredFields.forEach((name) => {
        const field = selfFoundForm.elements[name];
        field.setCustomValidity(field.value.trim() ? "" : "This field is required.");
      });
      const applicationLink = selfFoundForm.elements.applicationLink.value.trim();
      try {
        const url = new URL(applicationLink);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid link");
      } catch {
        selfFoundForm.elements.applicationLink.setCustomValidity("Enter a valid http or https link.");
      }
      if (!selfFoundForm.reportValidity()) return;
      const values = Object.fromEntries(new FormData(selfFoundForm));
      const internship = {
        id: crypto.randomUUID(),
        companyName: values.companyName.trim(),
        role: values.role.trim(),
        location: values.location.trim(),
        stipend: Number(values.stipend),
        deadline: values.deadline,
        eligibility: eligibilityFields.filter((field) => field.checked).map((field) => field.value),
        applicationLink,
      };
      try {
        const user = getUser();
        if (user?.role !== "student") throw new Error("This page is available to student accounts.");
        const internships = Array.isArray(user.selfFoundInternships) ? user.selfFoundInternships : [];
        await updateProfile({ selfFoundInternships: [...internships, internship] });
        route();
      } catch (error) {
        showFailure(error);
      }
    };
  }
  const pf = $("#postForm");
  if (pf) {
    const eligibilityFields = [...pf.querySelectorAll('input[name="eligibility"]')];
    const requiredTextFields = ["companyName", "role", "location", "deadline", "applicationLink"];
    const updateEligibilityValidity = () => {
      eligibilityFields[0].setCustomValidity(
        eligibilityFields.some((field) => field.checked) ? "" : "Select at least one eligible branch.",
      );
    };
    eligibilityFields.forEach((field) => {
      field.onchange = updateEligibilityValidity;
    });
    requiredTextFields.forEach((name) => {
      pf.elements[name].addEventListener("input", () => pf.elements[name].setCustomValidity(""));
    });
    const applicationLinkInput = pf.elements.applicationLink;
    const applicationLinkPreview = $("#applicationLinkPreview");
    applicationLinkInput.oninput = () => {
      try {
        const url = new URL(applicationLinkInput.value.trim());
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid link");
        applicationLinkPreview.href = url.href;
        applicationLinkPreview.textContent = url.href;
        applicationLinkPreview.hidden = false;
      } catch {
        applicationLinkPreview.hidden = true;
      }
    };
    pf.onsubmit = (e) => {
      e.preventDefault();
      updateEligibilityValidity();
      requiredTextFields.forEach((name) => {
        const field = pf.elements[name];
        field.setCustomValidity(field.value.trim() ? "" : "This field is required.");
      });
      if (!pf.reportValidity()) return;
      const values = Object.fromEntries(new FormData(pf));
      const eligibility = eligibilityFields.filter((field) => field.checked).map((field) => field.value);
      const internships = readPostedInternships();
      const existingIndex = internships.findIndex((item) => item.id === values.internshipId);
      const existing = existingIndex >= 0 ? internships[existingIndex] : null;
      const internship = {
        ...existing,
        id: existing?.id || crypto.randomUUID(),
        co: values.companyName.trim(),
        logo: values.companyName.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase(),
        role: values.role.trim(),
        src: "College Source",
        yr: eligibility.join(", "),
        dur: values.duration || "",
        skills: "",
        loc: values.location.trim(),
        pay: `${formatMoney(Number(values.stipend))}/month`,
        stipend: Number(values.stipend),
        approved: false,
        approvalStatus: "pending",
        deadline: values.deadline,
        eligibility,
        applicationLink: values.applicationLink.trim(),
      };
      try {
        if (existingIndex >= 0) internships[existingIndex] = internship;
        else internships.push(internship);
        localStorage.setItem(postedInternshipsKey, JSON.stringify(internships));
        addFacultyActivity(`${existing ? "Updated" : "Posted"} internship: ${internship.role} at ${internship.co}`, "coordinator");
        pf.reset();
        applicationLinkPreview.hidden = true;
        updateEligibilityValidity();
        route();
      } catch (error) {
        showFailure(error);
      }
    };
    $$(".edit-posting").forEach((button) => {
      button.onclick = () => {
        const internship = readPostedInternships().find((item) => item.id === button.dataset.id);
        if (!internship) return;
        pf.elements.internshipId.value = internship.id;
        pf.elements.companyName.value = internship.co || "";
        pf.elements.role.value = internship.role || "";
        pf.elements.location.value = internship.loc || "";
        pf.elements.stipend.value = internship.stipend ?? "";
        pf.elements.duration.value = internship.dur || "";
        pf.elements.deadline.value = internship.deadline || "";
        pf.elements.applicationLink.value = internship.applicationLink || "";
        eligibilityFields.forEach((field) => { field.checked = (internship.eligibility || []).includes(field.value); });
        pf.querySelector('[type="submit"]').textContent = "Save changes for review";
        $("#cancelPostEdit").hidden = false;
        applicationLinkInput.dispatchEvent(new Event("input"));
        pf.scrollIntoView({ behavior: "smooth", block: "center" });
      };
    });
    $("#cancelPostEdit").onclick = () => route();
    $$(".delete-posting").forEach((button) => {
      button.onclick = () => {
        if (!confirm("Delete this internship posting?")) return;
        const internships = readPostedInternships().filter((item) => item.id !== button.dataset.id);
        localStorage.setItem(postedInternshipsKey, JSON.stringify(internships));
        addFacultyActivity("Deleted an internship posting", "coordinator");
        route();
      };
    });
  }
  $$("#facultyGlobalSearch").forEach((form) => {
    form.onsubmit = (event) => {
      event.preventDefault();
      const query = new FormData(form).get("query").toString().trim();
      sessionStorage.setItem("collegeInternshipHub.facultySearch", query);
      location.hash = "faculty-search";
    };
  });
  const notificationButton = $("#facultyNotifications");
  if (notificationButton)
    notificationButton.onclick = () => { $("#facultyNotificationPanel").hidden = !$("#facultyNotificationPanel").hidden; };
  const studentDirectorySearch = $("#studentDirectorySearch");
  if (studentDirectorySearch) {
    const filterStudents = () => {
      const query = $("#studentDirectoryQuery").value.trim().toLowerCase();
      const branch = $("#studentDirectoryBranch").value;
      const year = $("#studentDirectoryYear").value;
      $$("#studentDirectoryTable tbody tr").forEach((row) => {
        row.hidden = !row.dataset.search.includes(query) || (branch && row.dataset.branch !== branch) || (year && row.dataset.year !== year);
      });
    };
    studentDirectorySearch.onsubmit = (event) => event.preventDefault();
    $("#studentDirectoryQuery").oninput = filterStudents;
    $("#studentDirectoryBranch").onchange = filterStudents;
    $("#studentDirectoryYear").onchange = filterStudents;
  }
  $$(".view-student-history").forEach((button) => {
    button.onclick = () => {
      sessionStorage.setItem("collegeInternshipHub.studentRecord", button.dataset.account);
      location.hash = "student-history";
    };
  });
  $$(".verify-record").forEach((button) => {
    button.onclick = () => {
      const account = readAccounts().find((item) => item.accountId === button.dataset.account);
      if (!account) return;
      const records = internshipList(account);
      const index = Number(button.dataset.index);
      if (!records[index]) return;
      records[index] = { ...records[index], verified: true, verificationStatus: "approved", verifiedAt: new Date().toISOString() };
      updateStoredAccount(account.accountId, (item) => ({ ...item, internships: records }));
      addFacultyActivity(`Verified ${records[index].internshipName || "an internship"} for ${account.name || account.id}`, "verified-records");
      route();
    };
  });
  $$(".reject-record").forEach((button) => {
    button.onclick = () => {
      const reason = prompt("Reason for rejecting this record:");
      if (!reason?.trim()) return;
      const account = readAccounts().find((item) => item.accountId === button.dataset.account);
      if (!account) return;
      const records = internshipList(account);
      const index = Number(button.dataset.index);
      if (!records[index]) return;
      records[index] = { ...records[index], verified: false, verificationStatus: "rejected", rejectionReason: reason.trim() };
      updateStoredAccount(account.accountId, (item) => ({ ...item, internships: records }));
      addFacultyActivity(`Rejected an internship record for ${account.name || account.id}`, "verify");
      route();
    };
  });
  const decidePosting = (id, approved) => {
    const internships = readPostedInternships();
    const item = internships.find((internship) => internship.id === id);
    if (!item) return;
    item.approved = approved;
    item.approvalStatus = approved ? "approved" : "rejected";
    item.reviewedAt = new Date().toISOString();
    localStorage.setItem(postedInternshipsKey, JSON.stringify(internships));
    addFacultyActivity(`${approved ? "Approved" : "Rejected"} ${item.role} at ${item.co}`, approved ? "coordinator" : "approvals");
    route();
  };
  $$(".approve-posting").forEach((button) => { button.onclick = () => decidePosting(button.dataset.id, true); });
  $$(".reject-posting").forEach((button) => {
    button.onclick = () => {
      const reason = prompt("Reason for rejecting this internship:");
      if (!reason?.trim()) return;
      const internships = readPostedInternships();
      const item = internships.find((internship) => internship.id === button.dataset.id);
      if (!item) return;
      item.reviewReason = reason.trim();
      decidePosting(button.dataset.id, false);
    };
  });
  const reportButton = $("#downloadStudentReport");
  if (reportButton) reportButton.onclick = () => {
    const students = readAccounts().filter((account) => account.role === "student");
    const rows = [["Name", "Roll number", "Branch", "Year", "Internship", "Company", "Duration", "Stipend", "Verification"]];
    students.forEach((student) => {
      const internships = internshipList(student);
      if (!internships.length) rows.push([student.name, student.id, student.branch, student.year, "", "", "", "", ""]);
      internships.forEach((internship) => rows.push([student.name, student.id, student.branch, student.year, internship.internshipName, internship.companyName, internship.durationMonths, internship.payment, internship.verified ? "Verified" : "Pending"]));
    });
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-internship-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const announcementForm = $("#announcementForm");
  if (announcementForm) {
    announcementForm.onsubmit = (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(announcementForm));
      const announcements = readLocalList(facultyAnnouncementsKey);
      const index = announcements.findIndex((item) => item.id === values.id);
      const announcement = { ...announcements[index], ...values, id: values.id || crypto.randomUUID(), date: new Date().toISOString().slice(0, 10) };
      if (index < 0) announcements.unshift(announcement);
      else announcements[index] = announcement;
      writeLocalList(facultyAnnouncementsKey, announcements);
      addFacultyActivity(`${index < 0 ? "Published" : "Updated"} announcement: ${announcement.title}`, "announcements");
      route();
    };
    $$(".edit-announcement").forEach((button) => {
      button.onclick = () => {
        const item = readLocalList(facultyAnnouncementsKey).find((entry) => entry.id === button.dataset.id);
        if (!item) return;
        for (const field of ["id", "title", "message", "audience", "expiryDate"]) announcementForm.elements[field].value = item[field] || "";
        $("#announcementFormHeading").textContent = "Edit announcement";
        announcementForm.querySelector('[type="submit"]').textContent = "Save changes";
        $("#cancelAnnouncementEdit").hidden = false;
      };
    });
    $("#cancelAnnouncementEdit").onclick = () => route();
    $$(".delete-announcement").forEach((button) => {
      button.onclick = () => {
        writeLocalList(facultyAnnouncementsKey, readLocalList(facultyAnnouncementsKey).filter((item) => item.id !== button.dataset.id));
        route();
      };
    });
  }
  const eventForm = $("#eventForm");
  if (eventForm) {
    eventForm.onsubmit = (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(eventForm));
      const events = readLocalList(facultyEventsKey);
      const index = events.findIndex((item) => item.id === values.id);
      const savedEvent = { ...events[index], ...values, id: values.id || crypto.randomUUID() };
      if (index < 0) events.push(savedEvent);
      else events[index] = savedEvent;
      writeLocalList(facultyEventsKey, events);
      addFacultyActivity(`${index < 0 ? "Scheduled" : "Updated"} event: ${savedEvent.title}`, "events");
      route();
    };
    $$(".edit-event").forEach((button) => {
      button.onclick = () => {
        const item = readLocalList(facultyEventsKey).find((entry) => entry.id === button.dataset.id);
        if (!item) return;
        for (const field of ["id", "title", "date", "time", "audience", "type"]) eventForm.elements[field].value = item[field] || "";
        $("#eventFormHeading").textContent = "Edit event";
        eventForm.querySelector('[type="submit"]').textContent = "Save changes";
        $("#cancelEventEdit").hidden = false;
      };
    });
    $("#cancelEventEdit").onclick = () => route();
    $$(".delete-event").forEach((button) => {
      button.onclick = () => {
        writeLocalList(facultyEventsKey, readLocalList(facultyEventsKey).filter((item) => item.id !== button.dataset.id));
        route();
      };
    });
  }
  const coordinatorForm = $("#coordinatorForm");
  if (coordinatorForm) coordinatorForm.onsubmit = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(coordinatorForm));
    const coordinators = readLocalList("collegeInternshipHub.coordinators");
    coordinators.push({ id: crypto.randomUUID(), name: values.name.trim(), responsibility: values.responsibility.trim() });
    writeLocalList("collegeInternshipHub.coordinators", coordinators);
    route();
  };
  $$(".delete-coordinator").forEach((button) => {
    button.onclick = () => {
      writeLocalList("collegeInternshipHub.coordinators", readLocalList("collegeInternshipHub.coordinators").filter((item) => item.id !== button.dataset.id));
      route();
    };
  });
  const directorySearch = $("#directorySearch");
  if (directorySearch) {
    directorySearch.onsubmit = (event) => event.preventDefault();
    $("#directoryQuery").oninput = () => {
      const query = $("#directoryQuery").value.trim().toLowerCase();
      $$(".directory-company").forEach((company) => { company.hidden = !company.dataset.search.includes(query); });
    };
  }
  const companyDirectoryForm = $("#companyDirectoryForm");
  if (companyDirectoryForm) {
    companyDirectoryForm.onsubmit = (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(companyDirectoryForm));
      if (values.website) {
        try {
          const url = new URL(values.website);
          if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid URL");
        } catch {
          companyDirectoryForm.elements.website.setCustomValidity("Enter a valid http or https website.");
          companyDirectoryForm.reportValidity();
          return;
        }
      }
      companyDirectoryForm.elements.website.setCustomValidity("");
      const companies = readLocalList("collegeInternshipHub.companyDirectory");
      const index = companies.findIndex((company) => company.id === values.id);
      const company = { ...companies[index], ...values, id: values.id || crypto.randomUUID(), name: values.name.trim() };
      if (index < 0) companies.push(company);
      else companies[index] = company;
      writeLocalList("collegeInternshipHub.companyDirectory", companies);
      route();
    };
    companyDirectoryForm.elements.website.addEventListener("input", () => companyDirectoryForm.elements.website.setCustomValidity(""));
    $$(".edit-company").forEach((button) => {
      button.onclick = () => {
        const company = readLocalList("collegeInternshipHub.companyDirectory").find((item) => item.id === button.dataset.id);
        if (!company) return;
        for (const field of ["id", "name", "website", "industry", "contact"]) companyDirectoryForm.elements[field].value = company[field] || "";
        $("#companyFormHeading").textContent = "Edit company details";
        companyDirectoryForm.querySelector('[type="submit"]').textContent = "Save changes";
        $("#cancelCompanyEdit").hidden = false;
      };
    });
    $("#cancelCompanyEdit").onclick = () => route();
    $$(".delete-company").forEach((button) => {
      button.onclick = () => {
        writeLocalList("collegeInternshipHub.companyDirectory", readLocalList("collegeInternshipHub.companyDirectory").filter((item) => item.id !== button.dataset.id));
        route();
      };
    });
  }
  const pi = $("#photoIn");
  if (pi)
    pi.onchange = () => {
      const f = pi.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => {
          const c = document.createElement("canvas");
          c.width = c.height = 150;
          const s = Math.min(im.width, im.height);
          c.getContext("2d").drawImage(
            im,
            (im.width - s) / 2,
            (im.height - s) / 2,
            s,
            s,
            0,
            0,
            150,
            150,
          );
          saveUser({ photo: c.toDataURL("image/jpeg", 0.8) });
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
  const rp = $("#rmPhoto");
  if (rp) rp.onclick = () => saveUser({ photo: "" });
  const detailsForm = $("#internshipDetailsForm");
  if (detailsForm)
    detailsForm.onsubmit = async (event) => {
      event.preventDefault();
      const user = getUser();
      const internships = internshipList(user);
      const values = Object.fromEntries(new FormData(detailsForm));
      values.payment = paymentAmount(values.payment);
      values.durationMonths = Number(values.durationMonths);
      if (values.payment === null || !Number.isFinite(values.durationMonths) || values.durationMonths < 1) {
        showFailure(new Error("Enter a valid monthly stipend and duration."));
        return;
      }
      const editingIndex = detailsForm.dataset.editingIndex;
      try {
        if (editingIndex !== undefined) {
          const index = Number(editingIndex);
          const existing = internships[index];
          if (!existing) throw new Error("Could not find this internship. Refresh and try again.");
          internships[index] = { ...existing, ...values };
          delete internships[index].period;
        } else {
          internships.push({ id: crypto.randomUUID(), ...values });
        }
        await updateProfile({ internships });
        route();
      } catch (error) {
        showFailure(error);
      }
    };
  $$(".internship-verification").forEach((checkbox) => {
    checkbox.onchange = async () => {
      const user = getUser();
      const internships = user && internshipList(user);
      const index = Number(checkbox.dataset.index);
      if (!internships?.[index]) {
        checkbox.checked = !checkbox.checked;
        return;
      }
      const checked = checkbox.checked;
      internships[index] = { ...internships[index], verified: checked };
      checkbox.disabled = true;
      try {
        await updateProfile({ internships });
      } catch (error) {
        checkbox.checked = !checked;
        showFailure(error);
      } finally {
        if (checkbox.isConnected) checkbox.disabled = false;
      }
    };
  });
  $$(".edit-internship").forEach((button) => {
    button.onclick = () => {
      const internship = internshipList(getUser())[Number(button.dataset.index)];
      if (!internship) return;
      detailsForm.dataset.editingIndex = button.dataset.index;
      for (const field of ["internshipName", "durationMonths"])
        detailsForm.elements[field].value = internship[field] || "";
      detailsForm.elements.payment.value = paymentAmount(internship.payment) ?? "";
      detailsForm.querySelector('[type="submit"]').textContent = "Save changes";
      $("#cancelInternshipEdit").hidden = false;
      detailsForm.scrollIntoView({ behavior: "smooth", block: "center" });
    };
  });
  const cancelInternshipEdit = $("#cancelInternshipEdit");
  if (cancelInternshipEdit)
    cancelInternshipEdit.onclick = () => route();
  $$(".delete-internship").forEach((button) => {
    button.onclick = async () => {
      if (!confirm("Delete this internship?")) return;
      const user = getUser();
      const internships = internshipList(user);
      const index = Number(button.dataset.index);
      internships.splice(index, 1);
      try {
        await updateProfile({ internships });
        route();
      } catch (error) {
        showFailure(error);
      }
    };
  });
}
let currentPage = "home";
let previousPage = null;
function route() {
  jobs.splice(0, jobs.length, ...readPostedInternships().filter((internship) => internship.approved === true));
  const p = (location.hash || "#home").slice(1);
  if (!getUser() && !["home", "login"].includes(p)) {
    alert("Login required. Please log in or sign up to view this page.");
    history.replaceState(null, "", `#${currentPage}`);
    if (!app.childElementCount) route();
    return;
  }
  renderNav();
  const nextPage = pages[p] ? p : "home";
  if (nextPage !== currentPage) {
    previousPage = currentPage;
    currentPage = nextPage;
  }
  const backButton = ["home", "coordinator"].includes(currentPage)
    ? ""
    : '<button class="btn out page-back" id="pageBack" type="button"><span aria-hidden="true">←</span> Back</button>';
  app.innerHTML = `${backButton}${pages[currentPage]()}`;
  bind();
  const pageBack = document.getElementById("pageBack");
  if (pageBack) pageBack.onclick = () => { location.hash = previousPage || "home"; };
  window.scrollTo(0, 0);
  document.getElementById("links").classList.remove("open");
}
document.getElementById("menuBtn").onclick = () =>
  document.getElementById("links").classList.toggle("open");
addEventListener("hashchange", route);
route();
