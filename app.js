(function () {
  "use strict";

  var LICENSE_KEY = "raiseNoteLicense";

  function hasLicense() {
    var v = localStorage.getItem(LICENSE_KEY);
    return !!(v && String(v).trim());
  }

  (function captureLicense() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("license");
    if (q && String(q).trim()) {
      localStorage.setItem(LICENSE_KEY, String(q).trim());
    }
  })();

  (function markLicensed() {
    if (!hasLicense()) return;
    var note = document.getElementById("checkout-note");
    var btn = document.getElementById("checkout-btn");
    if (note) note.textContent = "Licensed. PDFs download without the free-version line.";
    if (btn) {
      btn.textContent = "You're in";
      btn.setAttribute("href", "#tool");
    }
  })();

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sel = btn.getAttribute("data-copy");
      var el = sel ? document.querySelector(sel) : null;
      if (!el) return;
      var text = (el.innerText || el.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
      copyText(text).then(function () {
        var old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () {
          btn.textContent = old;
        }, 1600);
      });
    });
  });

  var form = document.getElementById("raise-form");
  if (!form) return;

  var dateInput = form.elements.date;
  if (dateInput && !dateInput.value) {
    var now = new Date();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    dateInput.value = now.getFullYear() + "-" + m + "-" + d;
  }

  function val(name) {
    var el = form.elements[name];
    if (!el) return "";
    return String(el.value || "").trim();
  }

  function parseIso(iso) {
    if (!iso) return null;
    var parts = iso.split("-").map(Number);
    if (parts.length < 3 || !parts[0]) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDate(iso) {
    var dt = parseIso(iso);
    if (!dt) return "";
    return dt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function stageLabel(stage) {
    if (stage === "reminder") return "Reminder raise note";
    return "First raise note";
  }

  function gather() {
    return {
      fromName: val("fromName") || "[Your name]",
      client: val("clientName") || "[Client]",
      project: val("projectName") || "[Project / relationship]",
      currentRate: val("currentRate") || "[current rate]",
      newRate: val("newRate") || "[new rate]",
      effectiveDate: formatDate(val("effectiveDate")),
      effectiveDateRaw: val("effectiveDate"),
      reason: val("reason"),
      whatStaysSame: val("whatStaysSame") || "[what stays the same]",
      stage: form.elements.stage.value,
      tone: form.elements.tone.value,
      yourEmail: val("yourEmail"),
      date: formatDate(val("date"))
    };
  }

  function buildEmail(data) {
    var reasonBit = data.reason
      ? " This reflects " + data.reason.replace(/\.$/, "") + "."
      : "";
    var stays = "What stays the same: " + data.whatStaysSame.replace(/\.$/, "") + ".";
    var effective = data.effectiveDate
      ? "The new rate takes effect on " + data.effectiveDate + "."
      : "The new rate takes effect on the date we agree.";
    var signOff = data.yourEmail
      ? data.fromName + "\n" + data.yourEmail
      : data.fromName;
    var subject;
    var body;

    if (data.stage === "reminder") {
      if (data.tone === "direct") {
        subject = "Reminder: updated rate for " + data.project;
        body = [
          "Hi " + data.client + ",",
          "",
          "A short reminder about my updated rate for " + data.project + ".",
          "My rate moves from " + data.currentRate + " to " + data.newRate + "." + reasonBit,
          "",
          effective,
          "",
          stays,
          "",
          "Please confirm you received this, or reply if you have questions.",
          "This is a rate update note, not a contract rewrite.",
          "",
          "Thanks,",
          signOff
        ].join("\n");
      } else {
        subject = "Reminder: updated rate for " + data.project;
        body = [
          "Hi " + data.client + ",",
          "",
          "Hope you are well. A gentle reminder about my updated rate for " + data.project + ".",
          "My rate moves from " + data.currentRate + " to " + data.newRate + "." + reasonBit,
          "",
          effective,
          "",
          stays,
          "",
          "I wanted to make sure this landed with you. Happy to answer any questions.",
          "This is a polite rate update, not a contract change.",
          "",
          "Thanks,",
          signOff
        ].join("\n");
      }
    } else {
      if (data.tone === "direct") {
        subject = "Updated rate for " + data.project;
        body = [
          "Hi " + data.client + ",",
          "",
          "I am writing to share an updated rate for " + data.project + ".",
          "My rate moves from " + data.currentRate + " to " + data.newRate + "." + reasonBit,
          "",
          effective,
          "",
          stays,
          "",
          "Please reply if you have questions. I value the work we do together.",
          "This is a rate update note, not a contract rewrite.",
          "",
          data.fromName + (data.yourEmail ? "\n" + data.yourEmail : "")
        ].join("\n");
      } else {
        subject = "Updated rate for " + data.project;
        body = [
          "Hi " + data.client + ",",
          "",
          "Hope you are well. I am writing to share an updated rate for " + data.project + ".",
          "My rate moves from " + data.currentRate + " to " + data.newRate + "." + reasonBit,
          "",
          effective,
          "",
          stays,
          "",
          "I am grateful for the work we have done together and look forward to continuing. Happy to talk through any questions.",
          "This is a polite rate update, not a contract change.",
          "",
          "Thanks,",
          signOff
        ].join("\n");
      }
    }

    return { subject: subject, body: body };
  }

  function el(id) {
    return document.getElementById(id);
  }

  function render() {
    var data = gather();
    var email = buildEmail(data);
    el("notice-kicker").textContent = stageLabel(data.stage);
    el("notice-amount").textContent = data.newRate !== "[new rate]" ? data.newRate : "New rate";
    el("notice-late").textContent =
      data.currentRate !== "[current rate]" && data.newRate !== "[new rate]"
        ? data.currentRate + " → " + data.newRate
        : "Add current and new rates";
    el("preview-subject").textContent = "Subject: " + email.subject;
    el("preview-body").textContent = email.body;
  }

  function hint(msg) {
    el("action-hint").textContent = msg;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      ta.remove();
      resolve();
    });
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);

  el("fill-example").addEventListener("click", function () {
    form.elements.fromName.value = "Lumen Studio";
    form.elements.clientName.value = "Calder Goods";
    form.elements.projectName.value = "Ongoing design retainer";
    form.elements.currentRate.value = "$95/hr";
    form.elements.newRate.value = "$115/hr";
    form.elements.reason.value = "rising costs and demand for the work";
    form.elements.whatStaysSame.value =
      "Same response times, same deliverable types, same revision rounds on the retainer";
    form.elements.yourEmail.value = "hello@lumen.studio";
    form.querySelector('input[name="stage"][value="first"]').checked = true;
    form.querySelector('input[name="tone"][value="warm"]').checked = true;
    var today = parseIso(val("date")) || new Date();
    var effective = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    function iso(dt) {
      var m = String(dt.getMonth() + 1).padStart(2, "0");
      var d = String(dt.getDate()).padStart(2, "0");
      return dt.getFullYear() + "-" + m + "-" + d;
    }
    form.elements.effectiveDate.value = iso(effective);
    render();
    hint("Example loaded. Copy the email or download the PDF.");
  });

  el("copy-email").addEventListener("click", function () {
    var data = gather();
    var email = buildEmail(data);
    var text = "Subject: " + email.subject + "\n\n" + email.body;
    copyText(text).then(function () {
      hint("Copied. Paste it into your mail app.");
    });
  });

  el("download-pdf").addEventListener("click", function () {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      hint("PDF library did not load. Check your connection and try again.");
      return;
    }
    if (
      !val("fromName") ||
      !val("clientName") ||
      !val("projectName") ||
      !val("currentRate") ||
      !val("newRate") ||
      !val("effectiveDate") ||
      !val("whatStaysSame")
    ) {
      hint("Fill name, client, relationship, rates, effective date, and what stays the same first.");
      return;
    }
    makePdf(gather());
    hint(hasLicense() ? "PDF downloaded." : "PDF downloaded. Free version includes a small footer line.");
  });

  function makePdf(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "pt", format: "letter" });
    var pageW = 612;
    var pageH = 792;
    var margin = 54;
    var width = pageW - margin * 2;
    var y = 50;
    var ink = [27, 23, 20];
    var muted = [111, 103, 94];
    var accent = [196, 53, 30];
    var rule = [212, 203, 189];
    var paper = [243, 238, 228];
    var footerTop = pageH - 56;
    var contentBottom = footerTop - 36;

    function setInk() {
      doc.setTextColor(ink[0], ink[1], ink[2]);
    }
    function setMuted() {
      doc.setTextColor(muted[0], muted[1], muted[2]);
    }

    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 0, 8, pageH, "F");

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    setInk();
    doc.text("Raise Note", margin, y);

    y += 16;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(1.2);
    doc.line(margin, y, margin + 34, y);

    y += 28;
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text("Rate update", margin, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setMuted();
    doc.text(stageLabel(data.stage).toUpperCase() + "  ·  NOT A CONTRACT REWRITE", margin, y + 14);

    y += 28;
    doc.setDrawColor(ink[0], ink[1], ink[2]);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin + width, y);

    y += 18;
    doc.setFillColor(paper[0], paper[1], paper[2]);
    doc.rect(margin, y, width, 64, "F");
    doc.setFont("times", "italic");
    doc.setFontSize(28);
    setInk();
    doc.text(data.newRate, margin + 14, y + 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setMuted();
    doc.text("from " + data.currentRate, margin + 14, y + 54);
    y += 84;

    var meta = [
      ["Date", data.date || ""],
      ["From", data.fromName],
      ["To", data.client],
      ["Relationship", data.project],
      ["Effective", data.effectiveDate || ""]
    ];
    if (data.yourEmail) meta.push(["Email", data.yourEmail]);

    var colGap = 16;
    var colW = (width - colGap) / 2;
    var leftY = y;
    var rightY = y;
    meta.forEach(function (row, i) {
      var useLeft = i % 2 === 0;
      var x = useLeft ? margin : margin + colW + colGap;
      var yy = useLeft ? leftY : rightY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setMuted();
      doc.text(row[0].toUpperCase(), x, yy);
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      setInk();
      var lines = doc.splitTextToSize(String(row[1]), colW);
      doc.text(lines, x, yy + 13);
      var next = yy + Math.max(28, lines.length * 13 + 16);
      if (useLeft) leftY = next;
      else rightY = next;
    });
    y = Math.max(leftY, rightY) + 4;

    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + width, y);
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setMuted();
    doc.text("RATE CHANGE", margin, y);
    y += 14;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    setInk();
    var rateText = data.currentRate + " → " + data.newRate;
    if (data.reason) rateText += ". Reason: " + data.reason.replace(/\.$/, "") + ".";
    var rateLines = doc.splitTextToSize(rateText, width);
    doc.text(rateLines, margin, y);
    y += rateLines.length * 14 + 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setMuted();
    doc.text("WHAT STAYS THE SAME", margin, y);
    y += 14;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    setInk();
    var stayLines = doc.splitTextToSize(data.whatStaysSame, width);
    doc.text(stayLines, margin, y);
    y += stayLines.length * 14 + 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setMuted();
    doc.text("NOTE", margin, y);
    y += 14;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    setInk();
    var note =
      "This is a rate update note for existing client work. It states the new rate and effective date. It is not a contract rewrite, not a threat, and not legal advice.";
    var noteLines = doc.splitTextToSize(note, width);
    if (y + noteLines.length * 14 < contentBottom) {
      doc.text(noteLines, margin, y);
      y += noteLines.length * 14 + 16;
    }

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    var ask = "Please confirm you received this, or reply with any questions.";
    var askLines = doc.splitTextToSize(ask, width);
    if (y + askLines.length * 14 < contentBottom) {
      doc.text(askLines, margin, y);
    }

    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerTop, margin + width, footerTop);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setMuted();
    var footer =
      "Generated by Raise Note. A business document helper, not legal advice, not a contract rewrite. Built by an AI agent.";
    if (!hasLicense()) {
      footer += " Created with the free version of Raise Note.";
    }
    doc.text(doc.splitTextToSize(footer, width), margin, footerTop + 14);

    var safe =
      String(data.project || "raise")
        .replace(/[^\w]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "raise";
    doc.save("rate-update-" + safe + ".pdf");
  }

  render();
})();
