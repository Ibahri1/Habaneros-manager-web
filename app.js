(() => {
  "use strict";
  const modules = {
    "src/renderer/app.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      require("./browserBridge");
      const defaults_1 = require("../shared/defaults");
      const types_1 = require("../shared/types");
      const time_1 = require("../shared/time");
      const employees_1 = require("./modules/employees/employees");
      const availability_1 = require("./modules/availability/availability");
      const scheduler_1 = require("./modules/scheduling/scheduler");
      const scheduleEditor_1 = require("./modules/scheduling/scheduleEditor");
      const reports_1 = require("./modules/reports/reports");
      const settings_1 = require("./modules/settings/settings");
      const dom_1 = require("./shared/dom");
      const ids_1 = require("./shared/ids");
      const login_1 = require("./modules/auth/login");
      let state = (0, defaults_1.defaultAppState)();
      let settings = { darkMode: false, confirmBeforeClose: true };
      let cloudConfig = { supabaseUrl: "", anonKey: "" };
      let submissions = [];
      let historyEditSourceId = null;
      const els = {
          loginScreen: (0, dom_1.byId)("loginScreen"),
          loginForm: (0, dom_1.byId)("loginForm"),
          loginPassword: (0, dom_1.byId)("loginPassword"),
          loginError: (0, dom_1.byId)("loginError"),
          availabilityChecks: (0, dom_1.byId)("availabilityChecks"),
          workerForm: (0, dom_1.byId)("workerForm"),
          workerName: (0, dom_1.byId)("workerName"),
          employeeCode: (0, dom_1.byId)("employeeCode"),
          workerPosition: (0, dom_1.byId)("workerPosition"),
          isManager: (0, dom_1.byId)("isManager"),
          skillRating: (0, dom_1.byId)("skillRating"),
          noHourLimits: (0, dom_1.byId)("noHourLimits"),
          maxWeeklyHours: (0, dom_1.byId)("maxWeeklyHours"),
          preferredWeeklyHours: (0, dom_1.byId)("preferredWeeklyHours"),
          workerOpenStart: (0, dom_1.byId)("workerOpenStart"),
          workerOpenEnd: (0, dom_1.byId)("workerOpenEnd"),
          workerCloseStart: (0, dom_1.byId)("workerCloseStart"),
          workerCloseEnd: (0, dom_1.byId)("workerCloseEnd"),
          workerNotes: (0, dom_1.byId)("workerNotes"),
          weekStart: (0, dom_1.byId)("weekStart"),
          openShift: (0, dom_1.byId)("openShift"),
          closeShift: (0, dom_1.byId)("closeShift"),
          shiftHours: (0, dom_1.byId)("shiftHours"),
          mealBreakHours: (0, dom_1.byId)("mealBreakHours"),
          staffingTable: (0, dom_1.byId)("staffingTable"),
          workersList: (0, dom_1.byId)("workersList"),
          workerCount: (0, dom_1.byId)("workerCount"),
          scheduleOutput: (0, dom_1.byId)("scheduleOutput"),
          scheduleStatus: (0, dom_1.byId)("scheduleStatus"),
          generateBtn: (0, dom_1.byId)("generateBtn"),
          printBtn: (0, dom_1.byId)("printBtn"),
          importBtn: (0, dom_1.byId)("importBtn"),
          exportJsonBtn: (0, dom_1.byId)("exportJsonBtn"),
          exportCsvBtn: (0, dom_1.byId)("exportCsvBtn"),
          clearBtn: (0, dom_1.byId)("clearBtn"),
          darkModeToggle: (0, dom_1.byId)("darkModeToggle"),
          cloudConfigForm: (0, dom_1.byId)("cloudConfigForm"),
          supabaseUrl: (0, dom_1.byId)("supabaseUrl"),
          supabaseAnonKey: (0, dom_1.byId)("supabaseAnonKey"),
          cloudStatus: (0, dom_1.byId)("cloudStatus"),
          testCloudBtn: (0, dom_1.byId)("testCloudBtn"),
          syncEmployeesBtn: (0, dom_1.byId)("syncEmployeesBtn"),
          refreshSubmissionsBtn: (0, dom_1.byId)("refreshSubmissionsBtn"),
          applyAllBtn: (0, dom_1.byId)("applyAllBtn"),
          submissionCount: (0, dom_1.byId)("submissionCount"),
          submissionsList: (0, dom_1.byId)("submissionsList"),
          historyCount: (0, dom_1.byId)("historyCount"),
          historyEmployeeFilter: (0, dom_1.byId)("historyEmployeeFilter"),
          historyWeekFilter: (0, dom_1.byId)("historyWeekFilter"),
          historyStatusFilter: (0, dom_1.byId)("historyStatusFilter"),
          historyList: (0, dom_1.byId)("historyList"),
          scheduleHistoryCount: (0, dom_1.byId)("scheduleHistoryCount"),
          saveCurrentScheduleBtn: (0, dom_1.byId)("saveCurrentScheduleBtn"),
          scheduleHistoryList: (0, dom_1.byId)("scheduleHistoryList"),
          scheduleHistoryEditor: (0, dom_1.byId)("scheduleHistoryEditor"),
          historyEditName: (0, dom_1.byId)("historyEditName"),
          historyEditWeek: (0, dom_1.byId)("historyEditWeek"),
          saveHistoryModificationsBtn: (0, dom_1.byId)("saveHistoryModificationsBtn")
      };
      const workerIdentityFields = [els.workerName, els.employeeCode, els.workerPosition];
      (0, login_1.requireManagerLogin)({ screen: els.loginScreen, form: els.loginForm, password: els.loginPassword, error: els.loginError }, () => void init());
      async function init() {
          try {
              state = await window.habanerosDesktop.loadState();
              settings = await window.habanerosDesktop.loadSettings();
              cloudConfig = await window.habanerosDesktop.loadCloudConfig();
          }
          catch (error) {
              showError("The local data file could not be loaded. The app will start with an empty schedule.", error);
              state = (0, defaults_1.defaultAppState)();
          }
          normalizeLoadedData();
          renderCloudConfig();
          renderAvailabilityInputs();
          renderStaffingInputs();
          bindEvents();
          updateAddWorkerHourFields();
          resetWorkerTimeInputs();
          render();
      }
      function normalizeLoadedData() {
          if (!state.rules.weekStart)
              state.rules.weekStart = (0, time_1.nextMonday)();
          state.workers = state.workers.map((worker) => (0, defaults_1.normalizeWorker)(worker, state.rules));
          (0, scheduleEditor_1.normalizeSchedule)(state.schedule, state.rules.mealBreakHours);
          state.scheduleHistory.forEach((entry) => (0, scheduleEditor_1.normalizeSchedule)(entry.schedule, state.rules.mealBreakHours));
          (0, settings_1.applyTheme)(settings);
          els.darkModeToggle.checked = settings.darkMode;
      }
      function bindEvents() {
          els.workerForm.addEventListener("submit", (event) => void addWorker(event));
          els.workerForm.addEventListener("reset", () => queueMicrotask(cleanupAfterDialog));
          window.addEventListener("focus", cleanupAfterDialog);
          document.addEventListener("visibilitychange", () => { if (!document.hidden)
              cleanupAfterDialog(); });
          els.noHourLimits.addEventListener("change", updateAddWorkerHourFields);
          els.generateBtn.addEventListener("click", () => void generateAndSaveSchedule());
          els.printBtn.addEventListener("click", () => void printSchedule());
          els.importBtn.addEventListener("click", () => void importData());
          els.exportJsonBtn.addEventListener("click", () => void exportData("json"));
          els.exportCsvBtn.addEventListener("click", () => void exportData("csv"));
          els.clearBtn.addEventListener("click", () => void clearData());
          els.darkModeToggle.addEventListener("change", () => void updateTheme());
          els.cloudConfigForm.addEventListener("submit", (event) => void saveCloudConfig(event));
          els.testCloudBtn.addEventListener("click", () => void testCloudConfig());
          els.syncEmployeesBtn.addEventListener("click", () => void syncCloudEmployees());
          els.refreshSubmissionsBtn.addEventListener("click", () => void refreshSubmissions());
          els.applyAllBtn.addEventListener("click", () => void applyAllSubmissions());
          els.saveCurrentScheduleBtn.addEventListener("click", () => void saveCurrentScheduleToHistory());
          els.saveHistoryModificationsBtn.addEventListener("click", () => void saveHistoryModifications());
          [els.historyEmployeeFilter, els.historyWeekFilter, els.historyStatusFilter].forEach((filter) => filter.addEventListener("change", renderHistory));
          [els.weekStart, els.openShift, els.closeShift, els.shiftHours, els.mealBreakHours].forEach((input) => input.addEventListener("change", () => void rulesChanged()));
      }
      function renderAvailabilityInputs() {
          els.availabilityChecks.innerHTML = types_1.DAYS.map((day) => '<label class="availability-day"><span>' + day + '</span><select data-add-shift="' + day + '" required><option value="Open">Available for Open</option><option value="Close">Available for Close</option><option value="Both">Available for Both</option><option value="Unavailable" selected>Not Available on ' + day + '</option></select></label>').join("");
      }
      function renderStaffingInputs() {
          els.staffingTable.innerHTML = types_1.DAYS.map((day) => {
              const needed = state.rules.staffing[day];
              return '<div class="staffing-row"><div><strong>' + day + '</strong><span>Minimum people needed</span></div><label>Open <input data-day="' + day + '" data-shift="open" type="number" min="0" max="20" value="' + needed.open + '"></label><label>Close <input data-day="' + day + '" data-shift="close" type="number" min="0" max="20" value="' + needed.close + '"></label></div>';
          }).join("");
          els.staffingTable.querySelectorAll("input").forEach((input) => input.addEventListener("change", () => void rulesChanged()));
      }
      function render() {
          els.weekStart.value = state.rules.weekStart;
          els.openShift.value = state.rules.openShift;
          els.closeShift.value = state.rules.closeShift;
          els.shiftHours.value = String(state.rules.shiftHours);
          els.mealBreakHours.value = String(state.rules.mealBreakHours);
          renderWorkers();
          renderSchedule();
          renderScheduleHistory();
          ensureWorkerFormInteractive();
      }
      async function addWorker(event) {
          event.preventDefault();
          try {
              const availability = selectedAvailableDays();
              const shiftAvailability = selectedShiftAvailability(availability);
              if (!els.workerName.value.trim()) {
                  await showDialogMessage("Enter an employee name before saving.");
                  return;
              }
              if (!/^\d{4}$/.test(els.employeeCode.value)) {
                  await showDialogMessage("Enter a valid 4-digit employee code.");
                  return;
              }
              if (state.workers.some((worker) => worker.employeeCode === els.employeeCode.value)) {
                  await showDialogMessage("That employee code is already assigned.");
                  return;
              }
              state.workers.push((0, employees_1.createWorker)({
                  employeeCode: els.employeeCode.value,
                  name: els.workerName.value,
                  position: els.workerPosition.value,
                  isManager: els.isManager.value === "true",
                  skillRating: Number(els.skillRating.value) || 5,
                  noHourLimits: els.noHourLimits.checked,
                  maxWeeklyHours: Number(els.maxWeeklyHours.value) || 0,
                  preferredWeeklyHours: Number(els.preferredWeeklyHours.value) || 0,
                  notes: els.workerNotes.value,
                  availability,
                  shiftAvailability,
                  openStart: els.workerOpenStart.value,
                  openEnd: els.workerOpenEnd.value,
                  closeStart: els.workerCloseStart.value,
                  closeEnd: els.workerCloseEnd.value
              }, state));
              resetWorkerForm();
              state.schedule = null;
              await saveState();
              render();
          }
          catch (error) {
              showError("The worker could not be added.", error);
          }
      }
      function selectedAvailableDays() {
          return types_1.DAYS.filter((day) => els.availabilityChecks.querySelector("[data-add-shift='" + day + "']")?.value !== "Unavailable");
      }
      function selectedShiftAvailability(days) {
          return types_1.DAYS.reduce((result, day) => {
              const select = els.availabilityChecks.querySelector("[data-add-shift='" + day + "']");
              result[day] = (select?.value || (days.includes(day) ? "Both" : "Unavailable"));
              return result;
          }, {});
      }
      function resetWorkerForm() {
          els.workerForm.reset();
          els.workerPosition.value = "Crew";
          els.isManager.value = "false";
          els.skillRating.value = "5";
          els.maxWeeklyHours.value = "45";
          els.preferredWeeklyHours.value = "40";
          updateAddWorkerHourFields();
          els.availabilityChecks.querySelectorAll("[data-add-shift]").forEach((select) => { select.value = "Unavailable"; });
          resetWorkerTimeInputs();
          ensureWorkerFormInteractive();
      }
      function ensureWorkerFormInteractive() {
          document.documentElement.removeAttribute("inert");
          document.documentElement.removeAttribute("aria-hidden");
          document.body.removeAttribute("inert");
          document.body.removeAttribute("aria-hidden");
          document.body.style.pointerEvents = "";
          els.workerForm.removeAttribute("inert");
          els.workerForm.removeAttribute("aria-hidden");
          els.workerForm.removeAttribute("aria-disabled");
          els.workerForm.style.pointerEvents = "";
          workerIdentityFields.forEach((field) => {
              field.disabled = false;
              field.readOnly = false;
              field.removeAttribute("aria-disabled");
              field.style.pointerEvents = "";
          });
      }
      function cleanupAfterDialog() {
          document.querySelectorAll("[data-dialog-overlay], .dialog-backdrop, .modal-backdrop").forEach((element) => element.remove());
          ensureWorkerFormInteractive();
          window.focus();
      }
      function updateAddWorkerHourFields() {
          els.preferredWeeklyHours.disabled = els.noHourLimits.checked;
          els.maxWeeklyHours.disabled = els.noHourLimits.checked;
      }
      function renderWorkers() {
          els.workerCount.textContent = state.workers.length + " worker" + (state.workers.length === 1 ? "" : "s");
          if (!state.workers.length) {
              els.workersList.innerHTML = '<div class="empty-state">No workers yet. Add workers and availability to begin.</div>';
              return;
          }
          els.workersList.innerHTML = state.workers.map((worker) => {
              const tags = (!worker.active ? '<span class="tag bad">Inactive</span>' : '') + (worker.noHourLimits ? '<span class="tag good">No Hour Limits</span>' : '') + (worker.isManager ? '<span class="tag good">Qualified to Open and Close</span>' : '');
              const daySummary = types_1.DAYS.map((day, index) => '<span class="day-mini ' + (worker.availability.includes(day) ? 'on' : '') + '">' + types_1.SHORT_DAYS[index] + (worker.availability.includes(day) ? ': ' + worker.shiftAvailability[day] : '') + '</span>').join("");
              const dayEditors = types_1.DAYS.map((day) => '<label class="worker-availability-day"><span>' + day + '</span><select data-edit-shift-worker="' + worker.id + '" data-edit-shift-day="' + day + '" required><option value="Open" ' + selected(worker.shiftAvailability[day] || 'Unavailable', 'Open') + '>Available for Open</option><option value="Close" ' + selected(worker.shiftAvailability[day] || 'Unavailable', 'Close') + '>Available for Close</option><option value="Both" ' + selected(worker.shiftAvailability[day] || 'Unavailable', 'Both') + '>Available for Both</option><option value="Unavailable" ' + selected(worker.shiftAvailability[day] || 'Unavailable', 'Unavailable') + '>Not Available on ' + day + '</option></select></label>').join("");
              const hourSummary = worker.noHourLimits ? 'No hour limits' : worker.preferredWeeklyHours + ' preferred hrs | ' + worker.maxWeeklyHours + ' max hrs';
              return '<article class="worker-card ' + (!worker.active ? 'inactive' : '') + '"><div class="worker-top"><div><h3>' + (0, dom_1.escapeHtml)(worker.name) + '</h3><div class="meta">Code ' + (0, dom_1.escapeHtml)(worker.employeeCode || 'Not set') + ' | ' + (0, dom_1.escapeHtml)(worker.position) + (worker.isManager ? ' | Lead' : '') + ' | Skill ' + worker.skillRating + '/10 | ' + hourSummary + '</div></div><div class="card-actions"><button class="secondary" type="button" data-toggle-active="' + worker.id + '">' + (worker.active ? 'Deactivate' : 'Activate') + '</button><button class="secondary danger" type="button" data-delete="' + worker.id + '">Delete</button></div></div><div class="tag-row">' + tags + '</div>' + (worker.notes ? '<div class="meta">Notes: ' + (0, dom_1.escapeHtml)(worker.notes) + '</div>' : '') + '<div class="worker-days">' + daySummary + '</div><div class="worker-edit"><label>Employee code <input data-edit="' + worker.id + '" data-field="employeeCode" type="text" inputmode="numeric" pattern="\\d{4}" maxlength="4" value="' + (0, dom_1.escapeHtml)(worker.employeeCode) + '"></label><label>Position <input data-edit="' + worker.id + '" data-field="position" type="text" value="' + (0, dom_1.escapeHtml)(worker.position) + '"></label><label>Lead <select data-edit="' + worker.id + '" data-field="isManager"><option value="false" ' + selected(String(worker.isManager), 'false') + '>No</option><option value="true" ' + selected(String(worker.isManager), 'true') + '>Yes</option></select></label><label>Skill Rating <input data-edit="' + worker.id + '" data-field="skillRating" type="number" min="1" max="10" step="1" value="' + worker.skillRating + '"></label><label class="check-row full"><input data-edit="' + worker.id + '" data-field="noHourLimits" type="checkbox" ' + checked(worker.noHourLimits) + '> No Hour Limits</label><label>Preferred Weekly Hours <input data-edit="' + worker.id + '" data-field="preferredWeeklyHours" type="number" min="0" max="168" step="0.5" value="' + worker.preferredWeeklyHours + '" ' + disabled(worker.noHourLimits) + '></label><label>Maximum Weekly Hours <input data-edit="' + worker.id + '" data-field="maxWeeklyHours" type="number" min="0" max="168" step="0.5" value="' + worker.maxWeeklyHours + '" ' + disabled(worker.noHourLimits) + '></label><div class="full time-grid"><label>Default Open Start <input data-worker-time="' + worker.id + '" data-shift="open" data-part="start" type="time" value="' + worker.shiftTimes.open.start + '"></label><label>Default Open End <input data-worker-time="' + worker.id + '" data-shift="open" data-part="end" type="time" value="' + worker.shiftTimes.open.end + '"></label><label>Default Close Start <input data-worker-time="' + worker.id + '" data-shift="close" data-part="start" type="time" value="' + worker.shiftTimes.close.start + '"></label><label>Default Close End <input data-worker-time="' + worker.id + '" data-shift="close" data-part="end" type="time" value="' + worker.shiftTimes.close.end + '"></label></div><label class="full">Notes <textarea data-edit="' + worker.id + '" data-field="notes" rows="2">' + (0, dom_1.escapeHtml)(worker.notes) + '</textarea></label><div class="full worker-days">' + dayEditors + '</div></div></article>';
          }).join("");
          els.workersList.querySelectorAll("[data-toggle-active]").forEach((button) => button.addEventListener("click", () => void toggleWorkerActive(button.dataset.toggleActive)));
          els.workersList.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => void deleteWorker(button.dataset.delete)));
          els.workersList.querySelectorAll("[data-edit]").forEach((input) => input.addEventListener("change", () => void editWorker(input)));
          els.workersList.querySelectorAll("[data-edit-shift-worker]").forEach((input) => input.addEventListener("change", () => void editWorkerShiftAvailability(input)));
          els.workersList.querySelectorAll("[data-worker-time]").forEach((input) => input.addEventListener("change", () => void editWorkerDefaultTime(input)));
      }
      function selected(current, value) { return current === value ? "selected" : ""; }
      function checked(value) { return value ? "checked" : ""; }
      function disabled(value) { return value ? "disabled" : ""; }
      async function toggleWorkerActive(id) {
          const worker = findWorker(id);
          if (!worker)
              return;
          worker.active = !worker.active;
          state.schedule = null;
          await saveStateAndRender();
      }
      async function deleteWorker(id) {
          const worker = findWorker(id);
          if (!worker)
              return;
          if (!await confirmDialog("Delete " + worker.name + "? This cannot be undone."))
              return;
          state.workers = state.workers.filter((item) => item.id !== id);
          state.schedule = null;
          await saveStateAndRender();
      }
      async function editWorker(input) {
          const worker = findWorker(input.dataset.edit || "");
          if (!worker)
              return;
          switch (input.dataset.field) {
              case "employeeCode":
                  if (!/^\d{4}$/.test(input.value)) {
                      await showDialogMessage("Employee code must contain exactly 4 digits.");
                      renderWorkers();
                      return;
                  }
                  if (state.workers.some((item) => item.id !== worker.id && item.employeeCode === input.value)) {
                      await showDialogMessage("That employee code is already assigned.");
                      renderWorkers();
                      return;
                  }
                  worker.employeeCode = input.value;
                  break;
              case "position":
                  worker.position = input.value || "Crew";
                  worker.role = worker.isManager ? "Lead" : "Crew";
                  break;
              case "isManager":
                  worker.isManager = input.value === "true";
                  worker.role = worker.isManager ? "Lead" : "Crew";
                  break;
              case "skillRating":
                  worker.skillRating = Math.min(10, Math.max(1, Math.round(Number(input.value) || 5)));
                  break;
              case "noHourLimits":
                  worker.noHourLimits = input instanceof HTMLInputElement ? input.checked : worker.noHourLimits;
                  break;
              case "maxWeeklyHours":
                  worker.maxWeeklyHours = Number(input.value) || 0;
                  break;
              case "preferredWeeklyHours":
                  worker.preferredWeeklyHours = Number(input.value) || 0;
                  break;
              case "notes":
                  worker.notes = input.value;
                  break;
              default: return;
          }
          state.schedule = null;
          await saveStateAndRender();
      }
      async function editWorkerShiftAvailability(input) {
          const worker = findWorker(input.dataset.editShiftWorker || "");
          const day = input.dataset.editShiftDay;
          if (!worker)
              return;
          const value = input.value;
          worker.shiftAvailability[day] = value;
          worker.availability = (0, availability_1.toggleAvailability)(worker.availability, day, value !== "Unavailable");
          state.schedule = null;
          await saveStateAndRender();
      }
      async function editWorkerDefaultTime(input) {
          const worker = findWorker(input.dataset.workerTime || "");
          if (!worker)
              return;
          const shift = input.dataset.shift === "close" ? "close" : "open";
          const part = input.dataset.part === "end" ? "end" : "start";
          worker.shiftTimes[shift][part] = input.value;
          await saveStateAndRender();
      }
      function findWorker(id) { return state.workers.find((worker) => worker.id === id); }
      async function rulesChanged() { syncRulesFromInputs(); state.schedule = null; await saveStateAndRender(); }
      function syncRulesFromInputs() {
          state.rules.weekStart = els.weekStart.value || (0, time_1.nextMonday)();
          state.rules.openShift = els.openShift.value || "08:00";
          state.rules.closeShift = els.closeShift.value || "16:00";
          state.rules.shiftHours = Number(els.shiftHours.value) || 8;
          state.rules.mealBreakHours = Number(els.mealBreakHours.value) || 6;
          els.staffingTable.querySelectorAll("input").forEach((input) => {
              const day = input.dataset.day;
              const shift = input.dataset.shift === "close" ? "close" : "open";
              state.rules.staffing[day][shift] = Number(input.value) || 0;
          });
      }
      async function generateAndSaveSchedule() {
          try {
              syncRulesFromInputs();
              state.schedule = (0, scheduler_1.generateSchedule)(state);
              state.scheduleHistory.unshift(createHistoryEntry("Week of " + formatWeek(state.rules.weekStart), state.rules.weekStart, state.schedule));
              await saveStateAndRender();
              const warnings = state.schedule.days.flatMap((day) => day.warnings);
              if (warnings.length)
                  await showDialogMessage("Schedule generated with warnings:\n\n" + warnings.slice(0, 8).join("\n") + (warnings.length > 8 ? "\n..." : ""));
          }
          catch (error) {
              showError("The schedule could not be generated.", error);
          }
      }
      function renderSchedule() {
          if (!state.schedule) {
              els.scheduleStatus.textContent = "Not generated";
              els.scheduleOutput.innerHTML = '<div class="empty-state">Add workers, confirm rules, then generate a schedule.</div>';
              return;
          }
          const warningCount = (0, reports_1.countScheduleWarnings)(state);
          els.scheduleStatus.textContent = warningCount ? warningCount + " warning" + (warningCount === 1 ? "" : "s") : "Ready";
          els.scheduleOutput.innerHTML = state.schedule.days.map((day) => '<article class="schedule-day"><div class="schedule-day-head"><div><strong>' + day.day + '</strong><div class="small-muted">' + (0, time_1.formatDate)(day.date) + '</div></div>' + (day.warnings.length ? '<span class="tag bad">' + day.warnings.length + ' issue' + (day.warnings.length === 1 ? '' : 's') + '</span>' : '<span class="tag good">Covered</span>') + '</div><div class="shift-list">' + renderShift(day.day, day.shifts.open, "Opening") + renderShift(day.day, day.shifts.close, "Closing") + '</div>' + (day.warnings.length ? '<div class="warnings">' + day.warnings.map((warning) => '<div class="warning problem">' + (0, dom_1.escapeHtml)(warning) + '</div>').join("") + '</div>' : '') + '</article>').join("");
          bindScheduleEditorEvents();
      }
      function renderShift(day, shift, label) {
          const assigned = shift.assigned.map((assignment) => renderAssignment(day, shift.name, assignment.assignmentId)).join("");
          const missingCount = Math.max(0, shift.needed - shift.assigned.length);
          const placeholders = Array.from({ length: missingCount }, (_item, index) => renderMissingAssignment(day, shift.name, index)).join("");
          const empty = !assigned && !placeholders ? '<div class="empty-state">No one assigned.</div>' : "";
          return '<div class="shift-box"><div class="shift-title"><span>' + label + '</span><span class="small-muted">Default ' + (0, time_1.formatTime)(shift.time) + ' | Need ' + shift.needed + '</span></div><div class="assigned-list">' + assigned + placeholders + empty + '</div></div>';
      }
      function renderMissingAssignment(day, shift, index) {
          const label = shift === "open" ? "Open" : "Close";
          const workerOptions = state.workers.filter((worker) => worker.active).map((worker) => '<option value="' + worker.id + '">' + (0, dom_1.escapeHtml)(worker.name) + '</option>').join("");
          return '<div class="assignment-editor" data-missing-row="' + day + '-' + shift + '-' + index + '"><label>' + label + '<select data-missing-assignment="true" data-missing-day="' + day + '" data-missing-shift="' + shift + '"><option value="">' + label + '</option>' + workerOptions + '</select></label><div class="assignment-summary"><span>Missing worker</span><span>Select to add</span></div></div>';
      }
      function renderAssignment(day, shift, assignmentId) {
          const assignment = (0, scheduleEditor_1.findAssignment)(state.schedule, assignmentId).assignment;
          const workerOptions = state.workers.map((worker) => '<option value="' + worker.id + '" ' + selected(worker.id, assignment.id) + '>' + (0, dom_1.escapeHtml)(worker.name) + '</option>').join("");
          const dayOptions = types_1.DAYS.map((item) => '<option value="' + item + '" ' + selected(item, day) + '>' + item + '</option>').join("");
          return '<div class="assignment-editor" data-assignment-row="' + assignment.assignmentId + '"><label>Employee<select data-assignment-field="employee" data-assignment-id="' + assignment.assignmentId + '">' + workerOptions + '</select></label><label>Day<select data-assignment-field="day" data-assignment-id="' + assignment.assignmentId + '">' + dayOptions + '</select></label><label>Shift<select data-assignment-field="shift" data-assignment-id="' + assignment.assignmentId + '"><option value="open" ' + selected(shift, 'open') + '>Open</option><option value="close" ' + selected(shift, 'close') + '>Close</option></select></label><label>Start<input data-assignment-field="start" data-assignment-id="' + assignment.assignmentId + '" type="time" value="' + assignment.start + '"></label><label>End<input data-assignment-field="end" data-assignment-id="' + assignment.assignmentId + '" type="time" value="' + assignment.end + '"></label><div class="assignment-summary"><span>' + (0, dom_1.escapeHtml)(assignment.position) + (assignment.isManager ? ' | Lead' : '') + '</span><span>' + (0, time_1.formatDuration)(assignment.durationHours) + '</span></div></div>' + (assignment.needsLunch ? '<div class="warning lunch">' + (0, dom_1.escapeHtml)(assignment.name) + ' reaches the configured lunch threshold. Plan lunch break.</div>' : '');
      }
      function bindScheduleEditorEvents() {
          els.scheduleOutput.querySelectorAll("[data-assignment-field]").forEach((input) => input.addEventListener("change", () => void editScheduleAssignment(input)));
          els.scheduleOutput.querySelectorAll("[data-missing-assignment]").forEach((input) => input.addEventListener("change", () => void addMissingScheduleAssignment(input)));
          els.scheduleOutput.querySelectorAll("[data-assignment-duplicate]").forEach((button) => button.addEventListener("click", () => void duplicateScheduleAssignment(button.dataset.assignmentDuplicate)));
          els.scheduleOutput.querySelectorAll("[data-assignment-remove]").forEach((button) => button.addEventListener("click", () => void removeScheduleAssignment(button.dataset.assignmentRemove)));
      }
      async function addMissingScheduleAssignment(input) {
          if (!state.schedule || !input.value)
              return;
          const worker = findWorker(input.value);
          const day = input.dataset.missingDay;
          const shift = input.dataset.missingShift;
          if (!worker || !day || !shift)
              return;
          (0, scheduleEditor_1.addManualAssignment)(state.schedule, day, shift, worker, state.rules);
          await saveEditedSchedule();
      }
      async function editScheduleAssignment(input) {
          if (!state.schedule)
              return;
          const location = (0, scheduleEditor_1.findAssignment)(state.schedule, input.dataset.assignmentId || "");
          if (!location)
              return;
          const field = input.dataset.assignmentField;
          if (field === "employee") {
              const worker = findWorker(input.value);
              if (worker)
                  (0, scheduleEditor_1.replaceAssignedEmployee)(location.assignment, worker);
          }
          else if (field === "day") {
              (0, scheduleEditor_1.moveAssignment)(state.schedule, location.assignment.assignmentId, input.value, location.shift);
          }
          else if (field === "shift") {
              (0, scheduleEditor_1.moveAssignment)(state.schedule, location.assignment.assignmentId, location.day, input.value);
          }
          else if (field === "start" || field === "end") {
              location.assignment[field] = input.value;
              (0, scheduleEditor_1.refreshAssignment)(location.assignment, state.rules.mealBreakHours);
          }
          await saveEditedSchedule();
      }
      async function duplicateScheduleAssignment(assignmentId) {
          if (!state.schedule)
              return;
          const location = (0, scheduleEditor_1.findAssignment)(state.schedule, assignmentId);
          if (!location)
              return;
          const nextDay = types_1.DAYS[(types_1.DAYS.indexOf(location.day) + 1) % types_1.DAYS.length];
          (0, scheduleEditor_1.duplicateAssignment)(state.schedule, assignmentId, nextDay, location.shift);
          await saveEditedSchedule();
      }
      async function removeScheduleAssignment(assignmentId) {
          if (!state.schedule)
              return;
          (0, scheduleEditor_1.removeAssignment)(state.schedule, assignmentId);
          await saveEditedSchedule();
      }
      async function saveEditedSchedule() {
          if (!state.schedule)
              return;
          (0, scheduleEditor_1.refreshScheduleCoverage)(state.schedule);
          await saveStateAndRender();
      }
      async function printSchedule() {
          if (!state.schedule) {
              await showDialogMessage("Generate a schedule before printing.");
              return;
          }
          try {
              const result = await window.habanerosDesktop.printSchedule(buildPrintHtml(state.schedule, state.rules.weekStart, "Habaneros Scheduler"));
              if (!result.success)
                  await showDialogMessage(result.message);
          }
          finally {
              await restoreAfterDialog();
          }
      }
      function buildPrintHtml(schedule, weekStart, title) {
          const compact = schedule.days.every((day) => day.shifts.open.assigned.length <= 4 && day.shifts.close.assigned.length <= 4);
          const warnings = schedule.days.flatMap((day) => day.warnings.map((warning) => '<div class="warning"><strong>' + day.day + ':</strong> ' + (0, dom_1.escapeHtml)(warning) + '</div>')).join("");
          const css = '@page{size:landscape;margin:.28in}*{box-sizing:border-box}body{font-family:Segoe UI,Arial,sans-serif;color:#182018;margin:0;font-size:10pt;line-height:1.18}.print-header{display:flex;align-items:end;justify-content:space-between;border-bottom:2px solid #246b46;padding:0 0 6px;margin:0 0 7px}.print-header h1{font-size:17pt;margin:0}.week{font-size:10pt;font-weight:700;color:#4d5a4e}.week-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;align-items:start}.week-grid.expanded{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.day{border:1px solid #aeb9ac;break-inside:avoid;page-break-inside:avoid;min-width:0}.day-head{background:#e9f1e8;border-bottom:1px solid #aeb9ac;padding:5px 6px;font-size:10pt;font-weight:800}.day-date{display:block;color:#536154;font-size:8pt;font-weight:600}.shift{padding:4px 6px;break-inside:avoid;page-break-inside:avoid}.shift+.shift{border-top:1px solid #cbd3c9}.shift-head{display:flex;justify-content:space-between;gap:4px;margin-bottom:3px;font-size:9pt}.shift-time{color:#59665a;white-space:nowrap}.person{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px;border-top:1px dotted #d4dbd2;padding:3px 0;break-inside:avoid;page-break-inside:avoid;font-size:8.5pt}.person-name{font-weight:700;overflow-wrap:anywhere}.person-time{white-space:nowrap}.empty{color:#697369;font-style:italic;padding:3px 0}.warnings-section{border-top:1px solid #aeb9ac;margin-top:6px;padding-top:5px;break-before:auto}.warnings-title{font-size:9pt;margin:0 0 3px}.warnings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 8px}.warning{color:#7d301b;font-size:7.5pt;break-inside:avoid;page-break-inside:avoid}@media print{html,body{width:100%;height:auto}.day,.shift,.person,.warning{break-inside:avoid;page-break-inside:avoid}}';
          return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + (0, dom_1.escapeHtml)(title) + '</title><style>' + css + '</style></head><body><header class="print-header"><h1>' + (0, dom_1.escapeHtml)(title) + '</h1><div class="week">Week of ' + (0, dom_1.escapeHtml)(weekStart) + '</div></header><main class="week-grid ' + (compact ? 'compact' : 'expanded') + '">' + schedule.days.map((day) => '<section class="day"><div class="day-head">' + day.day + '<span class="day-date">' + (0, time_1.formatDate)(day.date) + '</span></div>' + printShift(day.shifts.open, 'Opening') + printShift(day.shifts.close, 'Closing') + '</section>').join('') + '</main>' + (warnings ? '<section class="warnings-section"><h2 class="warnings-title">Schedule Warnings</h2><div class="warnings-grid">' + warnings + '</div></section>' : '') + '</body></html>';
      }
      function printShift(shift, label) {
          return '<div class="shift"><div class="shift-head"><strong>' + label + '</strong><span class="shift-time">' + (0, time_1.formatTime)(shift.time) + '</span></div>' + (shift.assigned.length ? shift.assigned.map((worker) => '<div class="person"><span class="person-name">' + (0, dom_1.escapeHtml)(worker.name) + (worker.isManager ? ' (Lead)' : '') + '</span><span class="person-time">' + worker.timeRange + '</span></div>').join('') : '<div class="empty">No one assigned</div>') + '</div>';
      }
      function createHistoryEntry(name, weekStart, schedule) {
          const createdAt = new Date().toISOString();
          return { id: (0, ids_1.createId)(), name: name.trim() || "Week of " + formatWeek(weekStart), weekStart, schedule: structuredClone(schedule), createdAt };
      }
      function renderScheduleHistory() {
          els.scheduleHistoryCount.textContent = state.scheduleHistory.length + " saved";
          els.saveCurrentScheduleBtn.disabled = !state.schedule;
          if (!state.scheduleHistory.length) {
              els.scheduleHistoryList.innerHTML = '<div class="empty-state">No saved schedules yet.</div>';
              return;
          }
          els.scheduleHistoryList.innerHTML = state.scheduleHistory.map((entry) => '<article class="history-row"><div><strong>' + (0, dom_1.escapeHtml)(entry.name) + '</strong><div class="meta">Week of ' + formatWeek(entry.weekStart) + '</div><div class="meta">Saved ' + formatSubmittedAt(entry.createdAt) + '</div></div><label>Schedule name <input data-history-name="' + entry.id + '" type="text" maxlength="160" value="' + (0, dom_1.escapeHtml)(entry.name) + '"></label><div class="card-actions"><button class="secondary" data-history-action="view" data-history-id="' + entry.id + '" type="button">View</button><button class="secondary" data-history-action="print" data-history-id="' + entry.id + '" type="button">Print</button><button class="secondary" data-history-action="rename" data-history-id="' + entry.id + '" type="button">Rename</button><button class="secondary" data-history-action="modify" data-history-id="' + entry.id + '" type="button">Modify</button></div></article>').join("");
          els.scheduleHistoryList.querySelectorAll("[data-history-action]").forEach((button) => button.addEventListener("click", () => void handleScheduleHistoryAction(button)));
      }
      async function handleScheduleHistoryAction(button) {
          const entry = state.scheduleHistory.find((item) => item.id === button.dataset.historyId);
          if (!entry)
              return;
          const action = button.dataset.historyAction;
          if (action === "print") {
              const result = await window.habanerosDesktop.printSchedule(buildPrintHtml(entry.schedule, entry.weekStart, entry.name));
              if (!result.success)
                  await showDialogMessage(result.message);
              return;
          }
          if (action === "rename") {
              const input = els.scheduleHistoryList.querySelector("[data-history-name='" + entry.id + "']");
              if (input?.value.trim())
                  entry.name = input.value.trim();
              await saveStateAndRender();
              return;
          }
          state.schedule = structuredClone(entry.schedule);
          state.rules.weekStart = entry.weekStart;
          (0, scheduleEditor_1.normalizeSchedule)(state.schedule, state.rules.mealBreakHours);
          if (action === "modify") {
              historyEditSourceId = entry.id;
              els.historyEditName.value = entry.name + " - Modified";
              els.historyEditWeek.value = entry.weekStart;
              els.scheduleHistoryEditor.hidden = false;
          }
          else {
              historyEditSourceId = null;
              els.scheduleHistoryEditor.hidden = true;
          }
          render();
      }
      async function saveCurrentScheduleToHistory() {
          if (!state.schedule)
              return;
          state.scheduleHistory.unshift(createHistoryEntry("Week of " + formatWeek(state.rules.weekStart), state.rules.weekStart, state.schedule));
          await saveStateAndRender();
      }
      async function saveHistoryModifications() {
          if (!historyEditSourceId || !state.schedule)
              return;
          const source = state.scheduleHistory.find((entry) => entry.id === historyEditSourceId);
          if (!source)
              return;
          const weekStart = els.historyEditWeek.value || source.weekStart;
          const schedule = structuredClone(state.schedule);
          schedule.days.forEach((day, index) => { day.date = (0, time_1.addDays)(weekStart, index); });
          state.scheduleHistory.unshift(createHistoryEntry(els.historyEditName.value || source.name + " - Modified", weekStart, schedule));
          historyEditSourceId = null;
          els.scheduleHistoryEditor.hidden = true;
          await saveStateAndRender();
      }
      async function exportData(format) {
          try {
              syncRulesFromInputs();
              const result = await window.habanerosDesktop.exportData({ format, state, settings });
              await showDialogMessage(result.message);
          }
          catch (error) {
              showError("Export failed.", error);
          }
          finally {
              await restoreAfterDialog();
          }
      }
      async function importData() {
          try {
              const imported = await window.habanerosDesktop.importData();
              if (imported.canceled)
                  return;
              const result = imported.fileName?.toLowerCase().endsWith(".csv") ? importCsv(imported.content || "") : importJson(imported.content || "");
              await saveStateAndRender();
              await showDialogMessage("Import complete.\n\nImported: " + result.imported + "\nSkipped: " + result.skipped + (result.messages.length ? "\n\n" + result.messages.join("\n") : ""));
          }
          catch (error) {
              showError("Import failed.", error);
          }
          finally {
              await restoreAfterDialog();
          }
      }
      function importJson(content) {
          const parsed = JSON.parse(content);
          const importedState = "state" in parsed && parsed.state ? parsed.state : parsed;
          const workers = importedState.workers || [];
          let imported = 0;
          let skipped = 0;
          for (const worker of workers) {
              if (mergeWorker((0, defaults_1.normalizeWorker)(worker, state.rules)))
                  imported++;
              else
                  skipped++;
          }
          if ("settings" in parsed && parsed.settings)
              settings = { ...settings, ...parsed.settings };
          if (importedState.rules)
              state.rules = { ...state.rules, ...importedState.rules };
          if (importedState.schedule) {
              state.schedule = importedState.schedule;
              (0, scheduleEditor_1.normalizeSchedule)(state.schedule, state.rules.mealBreakHours);
          }
          if (Array.isArray(importedState.scheduleHistory)) {
              const existingIds = new Set(state.scheduleHistory.map((entry) => entry.id));
              state.scheduleHistory.push(...importedState.scheduleHistory.filter((entry) => !existingIds.has(entry.id)));
          }
          return { imported, skipped, messages: skipped ? [String(skipped) + " duplicate employee(s) skipped."] : [] };
      }
      function importCsv(content) {
          const rows = parseCsv(content);
          if (rows.length < 2)
              return { imported: 0, skipped: 0, messages: ["CSV file did not contain employee rows."] };
          const headers = rows[0].map((header) => header.trim().toLowerCase());
          let imported = 0;
          let skipped = 0;
          for (const row of rows.slice(1)) {
              const get = (name) => row[headers.indexOf(name)] || "";
              const name = get("name") || get("employee name");
              if (!name.trim()) {
                  skipped++;
                  continue;
              }
              const isLead = yes(get("lead")) || yes(get("manager"));
              const worker = (0, defaults_1.normalizeWorker)({ id: (0, ids_1.createId)(), employeeCode: get("employee code"), name, position: get("position") || "Crew", role: isLead ? "Lead" : "Crew", isManager: isLead, skillRating: Number(get("skill rating")) || 5, noHourLimits: yes(get("no hour limits")), maxWeeklyHours: Number(get("max weekly hours")) || 45, preferredWeeklyHours: Number(get("preferred weekly hours")) || 40, maxDays: 7, active: !no(get("active")), notes: get("notes"), availability: splitDays(get("available days")), shiftAvailability: splitShiftAvailability(get("shift availability")), shiftTimes: { open: { start: get("default open start"), end: get("default open end") }, close: { start: get("default close start"), end: get("default close end") } } }, state.rules);
              if (mergeWorker(worker))
                  imported++;
              else
                  skipped++;
          }
          return { imported, skipped, messages: skipped ? [String(skipped) + " duplicate or invalid row(s) skipped."] : [] };
      }
      function mergeWorker(worker) {
          const key = worker.name.trim().toLowerCase();
          if (state.workers.some((existing) => existing.name.trim().toLowerCase() === key))
              return false;
          if (worker.employeeCode && state.workers.some((existing) => existing.employeeCode === worker.employeeCode))
              return false;
          state.workers.push(worker);
          state.schedule = null;
          return true;
      }
      function parseCsv(content) {
          const rows = [];
          let row = [];
          let cell = "";
          let quoted = false;
          for (let i = 0; i < content.length; i++) {
              const char = content[i];
              const next = content[i + 1];
              if (char === '"' && quoted && next === '"') {
                  cell += '"';
                  i++;
              }
              else if (char === '"')
                  quoted = !quoted;
              else if (char === ',' && !quoted) {
                  row.push(cell);
                  cell = "";
              }
              else if ((char === '\n' || char === '\r') && !quoted) {
                  if (char === '\r' && next === '\n')
                      i++;
                  row.push(cell);
                  rows.push(row);
                  row = [];
                  cell = "";
              }
              else
                  cell += char;
          }
          row.push(cell);
          if (row.some((value) => value.trim()))
              rows.push(row);
          return rows;
      }
      function yes(value) { return ["yes", "true", "1", "y"].includes(value.trim().toLowerCase()); }
      function no(value) { return ["no", "false", "0", "n", "inactive"].includes(value.trim().toLowerCase()); }
      function splitDays(value) { const parts = value.split(/[;,|]/).map((item) => item.trim().toLowerCase()); return types_1.DAYS.filter((day) => parts.includes(day.toLowerCase()) || parts.includes(day.slice(0, 3).toLowerCase())); }
      function splitShiftAvailability(value) { const result = {}; value.split(/[;|]/).forEach((item) => { const [dayText, shiftText] = item.split(":").map((part) => part.trim()); const day = types_1.DAYS.find((candidate) => candidate.toLowerCase() === dayText?.toLowerCase()); const shift = ["Open", "Close", "Both", "Unavailable"].find((candidate) => candidate.toLowerCase() === shiftText?.toLowerCase()); if (day && shift)
          result[day] = shift; }); return result; }
      function renderCloudConfig() {
          els.supabaseUrl.value = cloudConfig.supabaseUrl;
          els.supabaseAnonKey.value = cloudConfig.anonKey;
          els.cloudStatus.textContent = cloudConfig.supabaseUrl && cloudConfig.anonKey ? "Configured" : "Not configured";
      }
      function readCloudConfigForm() {
          return { supabaseUrl: els.supabaseUrl.value.trim().replace(/\/$/, ""), anonKey: els.supabaseAnonKey.value.trim() };
      }
      async function saveCloudConfig(event) {
          event.preventDefault();
          try {
              cloudConfig = await window.habanerosDesktop.saveCloudConfig(readCloudConfigForm());
              state = await window.habanerosDesktop.loadState();
              settings = await window.habanerosDesktop.loadSettings();
              normalizeLoadedData();
              renderCloudConfig();
              renderStaffingInputs();
              render();
              await showDialogMessage("Supabase settings saved.");
          }
          catch (error) {
              showError("Supabase settings could not be saved.", error);
          }
      }
      async function testCloudConfig() {
          try {
              const config = readCloudConfigForm();
              const result = await window.habanerosDesktop.testCloudConfig(config);
              els.cloudStatus.textContent = "Connected";
              await showDialogMessage(result.message);
          }
          catch (error) {
              els.cloudStatus.textContent = "Connection failed";
              showError("Supabase connection failed.", error);
          }
      }
      async function syncCloudEmployees() {
          try {
              cloudConfig = await window.habanerosDesktop.saveCloudConfig(readCloudConfigForm());
              const missingCodes = state.workers.filter((worker) => !/^\d{4}$/.test(worker.employeeCode));
              if (missingCodes.length) {
                  await showDialogMessage("Add a 4-digit code for every employee before syncing. Missing: " + missingCodes.map((worker) => worker.name).join(", "));
                  return;
              }
              const result = await window.habanerosDesktop.syncCloudEmployees(state.workers);
              els.cloudStatus.textContent = "Employees synced";
              await showDialogMessage(result.message);
          }
          catch (error) {
              showError("Employees could not be synced.", error);
          }
      }
      async function refreshSubmissions() {
          try {
              submissions = await window.habanerosDesktop.listAvailabilitySubmissions(null);
              renderSubmissions();
              renderHistoryFilters();
              renderHistory();
          }
          catch (error) {
              showError("Availability submissions could not be loaded. The local scheduler is still available.", error);
          }
      }
      function renderSubmissions() {
          const pending = submissions.filter((submission) => submission.status === "pending");
          els.submissionCount.textContent = pending.length + " pending";
          els.applyAllBtn.disabled = pending.length === 0;
          if (!pending.length) {
              els.submissionsList.innerHTML = '<div class="empty-state">No pending availability submissions.</div>';
              return;
          }
          els.submissionsList.innerHTML = pending.map((submission) => '<article class="submission-row"><div><strong>' + (0, dom_1.escapeHtml)(submission.employeeName) + '</strong><div class="meta">Week of ' + formatWeek(submission.weekStart) + '</div><div class="status-line">Submitted ' + formatSubmittedAt(submission.submittedAt) + '</div></div><div class="submission-days">' + types_1.DAYS.map((day) => '<label class="worker-availability-day"><span>' + day + '</span><select data-submission-shift="' + submission.id + '" data-submission-shift-day="' + day + '"><option value="Open" ' + selected(submission.shiftAvailability[day] || 'Unavailable', 'Open') + '>Available for Open</option><option value="Close" ' + selected(submission.shiftAvailability[day] || 'Unavailable', 'Close') + '>Available for Close</option><option value="Both" ' + selected(submission.shiftAvailability[day] || 'Unavailable', 'Both') + '>Available for Both</option><option value="Unavailable" ' + selected(submission.shiftAvailability[day] || 'Unavailable', 'Unavailable') + '>Not Available on ' + day + '</option></select></label>').join("") + '</div><div class="submission-actions"><button class="primary" data-submission-action="apply" data-submission-id="' + submission.id + '" type="button">Apply</button><button class="secondary" data-submission-action="reviewed" data-submission-id="' + submission.id + '" type="button">Mark Reviewed</button><button class="secondary danger" data-submission-action="rejected" data-submission-id="' + submission.id + '" type="button">Reject</button></div><label class="submission-notes">Manager Notes <textarea data-submission-notes="' + submission.id + '" rows="2" maxlength="1000" placeholder="Optional notes">' + (0, dom_1.escapeHtml)(submission.managerNotes) + '</textarea></label></article>').join("");
          els.submissionsList.querySelectorAll("[data-submission-shift]").forEach((input) => input.addEventListener("change", () => editSubmissionShift(input)));
          els.submissionsList.querySelectorAll("[data-submission-notes]").forEach((input) => input.addEventListener("input", () => editSubmissionNotes(input)));
          els.submissionsList.querySelectorAll("[data-submission-action]").forEach((button) => button.addEventListener("click", () => void handleSubmission(button)));
      }
      function editSubmissionShift(input) {
          const submission = submissions.find((item) => item.id === input.dataset.submissionShift);
          const day = input.dataset.submissionShiftDay;
          if (!submission)
              return;
          const value = input.value;
          submission.shiftAvailability[day] = value;
          submission.availableDays = (0, availability_1.toggleAvailability)(submission.availableDays, day, value !== "Unavailable");
      }
      function editSubmissionNotes(input) {
          const submission = submissions.find((item) => item.id === input.dataset.submissionNotes);
          if (submission)
              submission.managerNotes = input.value;
      }
      async function handleSubmission(button) {
          const submission = submissions.find((item) => item.id === button.dataset.submissionId);
          if (!submission)
              return;
          const action = button.dataset.submissionAction;
          try {
              if (action === "apply") {
                  const worker = findWorker(submission.localWorkerId);
                  if (!worker) {
                      await showDialogMessage("This submission is not linked to a local employee. Sync employees and try again.");
                      return;
                  }
                  worker.availability = [...submission.availableDays];
                  worker.shiftAvailability = { ...submission.shiftAvailability };
                  await saveState();
              }
              const status = action === "apply" ? "applied" : action;
              await window.habanerosDesktop.updateAvailabilitySubmission({ id: submission.id, availableDays: submission.availableDays, shiftAvailability: submission.shiftAvailability, status, managerNotes: submission.managerNotes });
              submission.status = status;
              submission.actionAt = new Date().toISOString();
              renderWorkers();
              renderSubmissions();
              renderHistoryFilters();
              renderHistory();
          }
          catch (error) {
              showError("The submission could not be updated.", error);
          }
      }
      async function applyAllSubmissions() {
          const pending = submissions.filter((submission) => submission.status === "pending");
          if (!pending.length)
              return;
          const missing = pending.filter((submission) => !findWorker(submission.localWorkerId));
          if (missing.length) {
              await showDialogMessage("These submissions are not linked to local employees: " + missing.map((item) => item.employeeName).join(", ") + ". Sync employees and try again.");
              return;
          }
          if (!await confirmDialog("Apply all " + pending.length + " pending availability submissions?"))
              return;
          try {
              for (const submission of pending) {
                  await window.habanerosDesktop.updateAvailabilitySubmission({ id: submission.id, availableDays: submission.availableDays, shiftAvailability: submission.shiftAvailability, status: "applied", managerNotes: submission.managerNotes });
              }
              for (const submission of pending) {
                  const worker = findWorker(submission.localWorkerId);
                  worker.availability = [...submission.availableDays];
                  worker.shiftAvailability = { ...submission.shiftAvailability };
                  submission.status = "applied";
                  submission.actionAt = new Date().toISOString();
              }
              await saveState();
              renderWorkers();
              renderSubmissions();
              renderHistoryFilters();
              renderHistory();
          }
          catch (error) {
              showError("Not every submission could be applied. Refresh the inbox before trying again.", error);
          }
      }
      function renderHistoryFilters() {
          const history = submissions.filter((submission) => submission.status !== "pending");
          const employeeValue = els.historyEmployeeFilter.value;
          const weekValue = els.historyWeekFilter.value;
          const employees = [...new Set(history.map((submission) => submission.employeeName))].sort();
          const weeks = [...new Set(history.map((submission) => submission.weekStart))].sort().reverse();
          els.historyEmployeeFilter.innerHTML = '<option value="">All employees</option>' + employees.map((name) => '<option value="' + (0, dom_1.escapeHtml)(name) + '">' + (0, dom_1.escapeHtml)(name) + '</option>').join("");
          els.historyWeekFilter.innerHTML = '<option value="">All weeks</option>' + weeks.map((week) => '<option value="' + week + '">Week of ' + formatWeek(week) + '</option>').join("");
          els.historyEmployeeFilter.value = employees.includes(employeeValue) ? employeeValue : "";
          els.historyWeekFilter.value = weeks.includes(weekValue) ? weekValue : "";
      }
      function renderHistory() {
          const history = submissions.filter((submission) => submission.status !== "pending" && (!els.historyEmployeeFilter.value || submission.employeeName === els.historyEmployeeFilter.value) && (!els.historyWeekFilter.value || submission.weekStart === els.historyWeekFilter.value) && (!els.historyStatusFilter.value || submission.status === els.historyStatusFilter.value));
          els.historyCount.textContent = history.length + " record" + (history.length === 1 ? "" : "s");
          if (!history.length) {
              els.historyList.innerHTML = '<div class="empty-state">No history records match these filters.</div>';
              return;
          }
          els.historyList.innerHTML = history.map((submission) => '<article class="history-row"><div><strong>' + (0, dom_1.escapeHtml)(submission.employeeName) + '</strong><div class="meta">Week of ' + formatWeek(submission.weekStart) + '</div><span class="tag ' + (submission.status === 'rejected' ? 'bad' : 'good') + '">' + (0, dom_1.escapeHtml)(submission.status) + '</span></div><div class="history-details"><span>Submitted: ' + formatSubmittedAt(submission.submittedAt) + '</span><span>Action: ' + (submission.actionAt ? formatSubmittedAt(submission.actionAt) : 'Not recorded') + '</span><span>Manager Notes: ' + (submission.managerNotes ? (0, dom_1.escapeHtml)(submission.managerNotes) : 'None') + '</span></div><button class="secondary danger" data-history-delete="' + submission.id + '" type="button">Delete Permanently</button></article>').join("");
          els.historyList.querySelectorAll("[data-history-delete]").forEach((button) => button.addEventListener("click", () => void deleteHistorySubmission(button.dataset.historyDelete)));
      }
      async function deleteHistorySubmission(id) {
          if (!await confirmDialog("Are you sure?"))
              return;
          try {
              await window.habanerosDesktop.deleteAvailabilitySubmission(id);
              submissions = submissions.filter((submission) => submission.id !== id);
              renderHistoryFilters();
              renderHistory();
          }
          catch (error) {
              showError("The history record could not be deleted.", error);
          }
      }
      function formatSubmittedAt(value) {
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
      }
      function formatWeek(value) {
          const date = new Date(value + "T12:00:00");
          return Number.isNaN(date.getTime()) ? (0, dom_1.escapeHtml)(value) : date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
      }
      async function clearData() {
          if (!await confirmDialog("Are you sure you want to reset all employee availability to Not Available? Employee profiles will be kept."))
              return;
          state.workers.forEach((worker) => {
              worker.availability = [];
              worker.shiftAvailability = types_1.DAYS.reduce((result, day) => ({ ...result, [day]: "Unavailable" }), {});
          });
          state.schedule = null;
          await saveStateAndRender();
      }
      async function updateTheme() {
          try {
              settings = { ...settings, darkMode: els.darkModeToggle.checked };
              (0, settings_1.applyTheme)(settings);
              await window.habanerosDesktop.saveSettings(settings);
          }
          catch (error) {
              showError("Theme preference could not be saved.", error);
          }
      }
      async function saveStateAndRender() {
          await saveState();
          render();
      }
      async function saveState() {
          try {
              state = await window.habanerosDesktop.saveState(state);
              await window.habanerosDesktop.setDirty(false);
          }
          finally {
              ensureWorkerFormInteractive();
          }
      }
      function resetWorkerTimeInputs() {
          const defaults = (0, defaults_1.defaultWorkerShiftTimes)(state.rules);
          els.workerOpenStart.value = defaults.open.start;
          els.workerOpenEnd.value = defaults.open.end;
          els.workerCloseStart.value = defaults.close.start;
          els.workerCloseEnd.value = defaults.close.end;
      }
      function showError(message, error) {
          console.error(message, error);
          void showDialogMessage(message + "\n\n" + (error instanceof Error ? error.message : "Please try again."));
      }
      async function showDialogMessage(message) {
          try {
              await window.habanerosDesktop.showMessage(message);
          }
          finally {
              cleanupAfterDialog();
          }
      }
      async function confirmDialog(message) {
          try {
              return await window.habanerosDesktop.showConfirmation(message);
          }
          finally {
              cleanupAfterDialog();
          }
      }
      async function restoreAfterDialog() {
          try {
              await window.habanerosDesktop.restoreFocus();
          }
          catch (error) {
              console.error("The main window could not restore focus after a dialog.", error);
          }
          finally {
              cleanupAfterDialog();
          }
      }
    },
    "src/renderer/browserBridge.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      const defaults_1 = require("../shared/defaults");
      const types_1 = require("../shared/types");
      const STATE_KEY = "habaneros-web-state";
      const SETTINGS_KEY = "habaneros-web-settings";
      const CLOUD_KEY = "habaneros-web-cloud-config";
      const MANAGER_STATE_ID = "habaneros-manager";
      let cloudLoaded = false;
      let saveChain = Promise.resolve();
      if (!window.habanerosDesktop) {
          let dirty = false;
          const api = {
              loadState: async () => loadManagerState(),
              saveState: async (state) => {
                  writeStorage(STATE_KEY, state);
                  queueManagerCloudSave();
                  return structuredClone(state);
              },
              loadSettings: async () => readStorage(SETTINGS_KEY, (0, defaults_1.defaultSettings)()),
              saveSettings: async (settings) => {
                  writeStorage(SETTINGS_KEY, settings);
                  queueManagerCloudSave();
                  return structuredClone(settings);
              },
              setDirty: async (isDirty) => (dirty = Boolean(isDirty)),
              restoreFocus: async () => window.focus(),
              showMessage: async (message) => { window.alert(message); },
              showConfirmation: async (message) => window.confirm(message),
              confirmClose: async () => !dirty || window.confirm("Close without saving?"),
              printSchedule: async (html) => printInBrowser(html),
              exportData: async (payload) => exportInBrowser(payload),
              importData: async () => importInBrowser(),
              loadCloudConfig: async () => readStorage(CLOUD_KEY, { supabaseUrl: "", anonKey: "" }),
              saveCloudConfig: async (config) => saveManagerCloudConfig(config),
              testCloudConfig: async (config) => {
                  await callRpc(config, "manager_list_availability_submissions", { p_status: "pending" });
                  return { success: true, message: "Connected to Supabase." };
              },
              syncCloudEmployees: async (workers) => syncEmployees(readStorage(CLOUD_KEY, { supabaseUrl: "", anonKey: "" }), workers),
              listAvailabilitySubmissions: async (status) => listSubmissions(readStorage(CLOUD_KEY, { supabaseUrl: "", anonKey: "" }), status),
              updateAvailabilitySubmission: async (input) => {
                  await callRpc(readStorage(CLOUD_KEY, { supabaseUrl: "", anonKey: "" }), "manager_update_availability_submission", { p_submission_id: input.id, p_available_days: input.availableDays, p_shift_availability: input.shiftAvailability, p_status: input.status, p_manager_notes: input.managerNotes });
                  return { success: true, message: "Submission updated." };
              },
              deleteAvailabilitySubmission: async (id) => {
                  await callRpc(readStorage(CLOUD_KEY, { supabaseUrl: "", anonKey: "" }), "manager_delete_availability_submission", { p_submission_id: id });
                  return { success: true, message: "Submission permanently deleted." };
              }
          };
          window.habanerosDesktop = api;
      }
      async function loadManagerState() {
          const localState = readStorage(STATE_KEY, (0, defaults_1.defaultAppState)());
          const config = readStorage(CLOUD_KEY, { supabaseUrl: "", anonKey: "" });
          if (!hasCloudConfig(config)) {
              setCloudStatus("Cloud save not configured");
              return localState;
          }
          setCloudStatus("Loading...");
          try {
              const cloud = await loadManagerCloudState(config);
              if (cloud?.state) {
                  persistCloudPayload(cloud);
                  cloudLoaded = true;
                  setCloudStatus("Saved");
                  return structuredClone(cloud.state);
              }
              cloudLoaded = true;
              if (hasMeaningfulState(localState))
                  await saveManagerCloudState(config);
              else
                  setCloudStatus("No cloud data yet");
              return localState;
          }
          catch (error) {
              setCloudStatus("Cloud load failed");
              console.warn("Manager cloud state could not be loaded.", error);
              return localState;
          }
      }
      async function saveManagerCloudConfig(config) {
          const cleanConfig = { supabaseUrl: config.supabaseUrl.trim().replace(/\/$/, ""), anonKey: config.anonKey.trim() };
          writeStorage(CLOUD_KEY, cleanConfig);
          if (!hasCloudConfig(cleanConfig)) {
              setCloudStatus("Cloud save not configured");
              return structuredClone(cleanConfig);
          }
          setCloudStatus("Loading...");
          try {
              const cloud = await loadManagerCloudState(cleanConfig);
              if (cloud?.state) {
                  persistCloudPayload({ ...cloud, cloudConfig: cleanConfig });
                  cloudLoaded = true;
                  setCloudStatus("Saved");
              }
              else {
                  cloudLoaded = true;
                  await saveManagerCloudState(cleanConfig);
              }
          }
          catch (error) {
              setCloudStatus("Cloud save unavailable");
              console.warn("Manager cloud state could not be initialized.", error);
          }
          return structuredClone(cleanConfig);
      }
      function queueManagerCloudSave() {
          const config = readStorage(CLOUD_KEY, { supabaseUrl: "", anonKey: "" });
          if (!hasCloudConfig(config)) {
              setCloudStatus("Cloud save not configured");
              return;
          }
          setCloudStatus("Saving...");
          saveChain = saveChain
              .then(() => saveManagerCloudState(config))
              .catch((error) => {
              setCloudStatus("Save failed");
              console.warn("Manager cloud state could not be saved.", error);
          });
      }
      async function loadManagerCloudState(config) {
          const rows = await callRpc(config, "manager_load_app_state", { p_id: MANAGER_STATE_ID });
          return rows[0]?.state_data || null;
      }
      async function saveManagerCloudState(config) {
          const state = readStorage(STATE_KEY, (0, defaults_1.defaultAppState)());
          const settings = readStorage(SETTINGS_KEY, (0, defaults_1.defaultSettings)());
          const payload = { state, settings, cloudConfig: config };
          if (!cloudLoaded) {
              const cloud = await loadManagerCloudState(config);
              if (cloud?.state && hasMeaningfulState(cloud.state) && !hasMeaningfulState(state)) {
                  persistCloudPayload(cloud);
                  cloudLoaded = true;
                  setCloudStatus("Cloud data kept");
                  return;
              }
              cloudLoaded = true;
          }
          await callRpc(config, "manager_save_app_state", { p_id: MANAGER_STATE_ID, p_state_data: payload });
          setCloudStatus("Saved");
      }
      function persistCloudPayload(payload) {
          if (payload.state)
              writeStorage(STATE_KEY, payload.state);
          if (payload.settings)
              writeStorage(SETTINGS_KEY, payload.settings);
          if (payload.cloudConfig)
              writeStorage(CLOUD_KEY, payload.cloudConfig);
      }
      function hasCloudConfig(config) {
          return Boolean(config.supabaseUrl && config.anonKey);
      }
      function hasMeaningfulState(state) {
          return state.workers.length > 0 || Boolean(state.schedule) || state.scheduleHistory.length > 0;
      }
      function setCloudStatus(message) {
          const status = document.getElementById("cloudStatus");
          if (status)
              status.textContent = message;
      }
      function readStorage(key, fallback) {
          const value = localStorage.getItem(key);
          if (!value)
              return structuredClone(fallback);
          try {
              return JSON.parse(value);
          }
          catch {
              return structuredClone(fallback);
          }
      }
      function writeStorage(key, value) {
          localStorage.setItem(key, JSON.stringify(value));
          return structuredClone(value);
      }
      function printInBrowser(html) {
          if (!html.trim())
              return { success: false, message: "Generate a schedule before printing." };
          const printWindow = window.open("", "_blank");
          if (!printWindow)
              return { success: false, message: "The print window was blocked by the browser." };
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          return { success: true, message: "Print window opened." };
      }
      function exportInBrowser(payload) {
          const extension = payload.format === "csv" ? "csv" : "json";
          const content = payload.format === "csv" ? toCsv(payload) : JSON.stringify({ state: payload.state, settings: payload.settings, exportedAt: new Date().toISOString() }, null, 2);
          const url = URL.createObjectURL(new Blob([content], { type: payload.format === "csv" ? "text/csv" : "application/json" }));
          const link = document.createElement("a");
          link.href = url;
          link.download = "habaneros-scheduler-export." + extension;
          link.click();
          URL.revokeObjectURL(url);
          return { success: true, message: "Export downloaded." };
      }
      function importInBrowser() {
          return new Promise((resolve) => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json,.csv,application/json,text/csv";
              let finished = false;
              input.addEventListener("change", async () => {
                  finished = true;
                  const file = input.files?.[0];
                  resolve(file ? { canceled: false, fileName: file.name, content: await file.text() } : { canceled: true });
              }, { once: true });
              input.addEventListener("cancel", () => { if (!finished)
                  resolve({ canceled: true }); }, { once: true });
              input.click();
          });
      }
      async function syncEmployees(config, workers) {
          const eligible = workers.filter((worker) => /^\d{4}$/.test(worker.employeeCode));
          for (const worker of eligible)
              await callRpc(config, "manager_upsert_employee", { p_local_worker_id: worker.id, p_name: worker.name, p_employee_code: worker.employeeCode, p_active: worker.active, p_no_hour_limits: worker.noHourLimits });
          return { success: true, message: eligible.length + " employee" + (eligible.length === 1 ? "" : "s") + " synced." };
      }
      async function listSubmissions(config, status) {
          const rows = await callRpc(config, "manager_list_availability_submissions", { p_status: status });
          return rows.map((row) => ({ id: row.id, employeeId: row.employee_id, localWorkerId: row.local_worker_id, employeeName: row.employee_name, weekStart: row.week_start, availableDays: row.available_days, shiftAvailability: types_1.DAYS.reduce((map, day) => ({ ...map, [day]: row.available_days.includes(day) ? row.shift_availability?.[day] || "Both" : "Unavailable" }), {}), submittedAt: row.submitted_at, status: row.status, actionAt: row.action_at, managerNotes: row.manager_notes || "" }));
      }
      async function callRpc(config, functionName, body) {
          if (!config.supabaseUrl || !config.anonKey)
              throw new Error("Supabase URL and anon key are required.");
          const response = await fetch(config.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/" + functionName, { method: "POST", headers: { apikey: config.anonKey, Authorization: "Bearer " + config.anonKey, "Content-Type": "application/json" }, body: JSON.stringify(body) });
          const text = await response.text();
          if (!response.ok) {
              let message = "Supabase request failed (" + response.status + ").";
              try {
                  message = JSON.parse(text).message || message;
              }
              catch { /* Keep status message. */ }
              throw new Error(message);
          }
          return (text ? JSON.parse(text) : null);
      }
      function toCsv(payload) {
          const rows = [["Name", "Employee Code", "Position", "Lead", "Skill Rating", "No Hour Limits", "Active", "Max Weekly Hours", "Preferred Weekly Hours", "Available Days", "Shift Availability", "Default Open Start", "Default Open End", "Default Close Start", "Default Close End", "Notes"]];
          for (const worker of payload.state.workers)
              rows.push([worker.name, worker.employeeCode, worker.position, worker.isManager ? "Yes" : "No", String(worker.skillRating), worker.noHourLimits ? "Yes" : "No", worker.active ? "Yes" : "No", String(worker.maxWeeklyHours), String(worker.preferredWeeklyHours), worker.availability.join(";"), Object.entries(worker.shiftAvailability).map(([day, shift]) => day + ":" + shift).join(";"), worker.shiftTimes.open.start, worker.shiftTimes.open.end, worker.shiftTimes.close.start, worker.shiftTimes.close.end, worker.notes]);
          return rows.map((row) => row.map((value) => '"' + String(value).replaceAll('"', '""') + '"').join(",")).join("\n");
      }
    },
    "src/renderer/modules/auth/login.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.requireManagerLogin = requireManagerLogin;
      const SESSION_KEY = "habaneros-manager-authenticated";
      const MANAGER_PASSWORD = "92118";
      function requireManagerLogin(elements, onAuthenticated) {
          const unlock = () => {
              document.body.classList.remove("login-locked");
              elements.screen.hidden = true;
              onAuthenticated();
          };
          if (sessionStorage.getItem(SESSION_KEY) === "true") {
              unlock();
              return;
          }
          document.body.classList.add("login-locked");
          elements.screen.hidden = false;
          elements.form.addEventListener("submit", (event) => {
              event.preventDefault();
              if (elements.password.value !== MANAGER_PASSWORD) {
                  elements.error.textContent = "Incorrect password. Please try again.";
                  elements.password.select();
                  return;
              }
              sessionStorage.setItem(SESSION_KEY, "true");
              elements.error.textContent = "";
              elements.password.value = "";
              unlock();
          });
          queueMicrotask(() => elements.password.focus());
      }
    },
    "src/renderer/modules/availability/availability.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toggleAvailability = toggleAvailability;
      function toggleAvailability(days, day, enabled) { if (enabled && !days.includes(day))
          return [...days, day]; if (!enabled)
          return days.filter((item) => item !== day); return days; }
    },
    "src/renderer/modules/employees/employees.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createWorker = createWorker;
      const ids_1 = require("../../shared/ids");
      const defaults_1 = require("../../../shared/defaults");
      function createWorker(input, state) {
          return (0, defaults_1.normalizeWorker)({
              id: (0, ids_1.createId)(),
              employeeCode: input.employeeCode,
              name: input.name.trim(),
              position: input.position.trim() || "Crew",
              role: input.isManager ? "Lead" : "Crew",
              isManager: input.isManager,
              skillRating: input.skillRating,
              noHourLimits: input.noHourLimits,
              maxWeeklyHours: input.maxWeeklyHours,
              preferredWeeklyHours: input.preferredWeeklyHours,
              maxDays: 7,
              active: true,
              notes: input.notes,
              availability: input.availability,
              shiftAvailability: input.shiftAvailability,
              shiftTimes: { open: { start: input.openStart, end: input.openEnd }, close: { start: input.closeStart, end: input.closeEnd } }
          }, state.rules);
      }
    },
    "src/renderer/modules/reports/reports.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.countScheduleWarnings = countScheduleWarnings;
      function countScheduleWarnings(state) { if (!state.schedule)
          return 0; return state.schedule.days.reduce((count, day) => { const lunchWarnings = Object.values(day.shifts).flatMap((shift) => shift.assigned.filter((worker) => worker.needsLunch)).length; return count + day.warnings.length + lunchWarnings; }, 0); }
    },
    "src/renderer/modules/scheduling/scheduleEditor.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.refreshAssignment = refreshAssignment;
      exports.normalizeSchedule = normalizeSchedule;
      exports.findAssignment = findAssignment;
      exports.moveAssignment = moveAssignment;
      exports.removeAssignment = removeAssignment;
      exports.duplicateAssignment = duplicateAssignment;
      exports.addManualAssignment = addManualAssignment;
      exports.replaceAssignedEmployee = replaceAssignedEmployee;
      exports.refreshScheduleCoverage = refreshScheduleCoverage;
      const time_1 = require("../../../shared/time");
      const ids_1 = require("../../shared/ids");
      function refreshAssignment(assignment, mealBreakHours) {
          assignment.durationHours = (0, time_1.getShiftDurationHours)(assignment.start, assignment.end);
          assignment.timeRange = (0, time_1.formatTime)(assignment.start) + "-" + (0, time_1.formatTime)(assignment.end);
          assignment.needsLunch = assignment.durationHours >= mealBreakHours;
      }
      function normalizeSchedule(schedule, mealBreakHours) {
          schedule?.days.forEach((day) => {
              ["open", "close"].forEach((shiftName) => {
                  day.shifts[shiftName].assigned.forEach((assignment) => {
                      if (!assignment.assignmentId)
                          assignment.assignmentId = (0, ids_1.createId)();
                      refreshAssignment(assignment, mealBreakHours);
                  });
              });
          });
      }
      function findAssignment(schedule, assignmentId) {
          for (const day of schedule.days) {
              for (const shift of ["open", "close"]) {
                  const index = day.shifts[shift].assigned.findIndex((assignment) => assignment.assignmentId === assignmentId);
                  if (index >= 0)
                      return { assignment: day.shifts[shift].assigned[index], day: day.day, shift, index };
              }
          }
          return undefined;
      }
      function moveAssignment(schedule, assignmentId, day, shift) {
          const source = findAssignment(schedule, assignmentId);
          const targetDay = schedule.days.find((item) => item.day === day);
          if (!source || !targetDay || (source.day === day && source.shift === shift))
              return;
          const [assignment] = schedule.days.find((item) => item.day === source.day).shifts[source.shift].assigned.splice(source.index, 1);
          targetDay.shifts[shift].assigned.push(assignment);
      }
      function removeAssignment(schedule, assignmentId) {
          const source = findAssignment(schedule, assignmentId);
          if (!source)
              return;
          schedule.days.find((item) => item.day === source.day).shifts[source.shift].assigned.splice(source.index, 1);
      }
      function duplicateAssignment(schedule, assignmentId, day, shift) {
          const source = findAssignment(schedule, assignmentId);
          const targetDay = schedule.days.find((item) => item.day === day);
          if (!source || !targetDay)
              return;
          targetDay.shifts[shift].assigned.push({ ...source.assignment, assignmentId: (0, ids_1.createId)() });
      }
      function addManualAssignment(schedule, day, shift, worker, rules) {
          const targetDay = schedule.days.find((item) => item.day === day);
          if (!targetDay)
              return;
          const fallbackStart = shift === "open" ? rules.openShift : rules.closeShift;
          const fallbackEnd = (0, time_1.addHoursToTime)(fallbackStart, Number(rules.shiftHours) || 8);
          const defaultTimes = worker.shiftTimes[shift];
          const start = defaultTimes?.start || fallbackStart;
          const end = defaultTimes?.end || fallbackEnd;
          const assignment = {
              assignmentId: (0, ids_1.createId)(),
              id: worker.id,
              name: worker.name,
              position: worker.position,
              role: worker.role,
              isManager: worker.isManager,
              start,
              end,
              timeRange: "",
              durationHours: 0,
              needsLunch: false
          };
          refreshAssignment(assignment, rules.mealBreakHours);
          targetDay.shifts[shift].assigned.push(assignment);
      }
      function replaceAssignedEmployee(assignment, worker) {
          assignment.id = worker.id;
          assignment.name = worker.name;
          assignment.position = worker.position;
          assignment.role = worker.role;
          assignment.isManager = worker.isManager;
      }
      function refreshScheduleCoverage(schedule) {
          schedule.days.forEach((day) => {
              const warnings = [];
              ["open", "close"].forEach((shiftName) => {
                  const shift = day.shifts[shiftName];
                  shift.hasManager = shift.assigned.some((assignment) => assignment.isManager);
                  shift.hasQualified = shift.hasManager;
                  if (shift.needed > 0 && !shift.hasManager)
                      warnings.push("No Lead assigned for " + day.day + " " + shiftName + ".");
                  if (shift.assigned.length < shift.needed)
                      warnings.push("Unfilled " + shiftName + " shift on " + day.day + ": " + shift.assigned.length + " of " + shift.needed + " filled.");
              });
              day.warnings = warnings;
          });
      }
    },
    "src/renderer/modules/scheduling/scheduler.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.generateSchedule = generateSchedule;
      const time_1 = require("../../../shared/time");
      const ids_1 = require("../../shared/ids");
      function shiftDuration(worker, shiftName) { return (0, time_1.getShiftDurationHours)(worker.shiftTimes[shiftName].start, worker.shiftTimes[shiftName].end); }
      function canWork(worker, context, stats) {
          if (!worker.active || !worker.availability.includes(context.day) || context.assignedToday.has(worker.id))
              return false;
          const availability = worker.shiftAvailability[context.day] || "Both";
          if (availability === "Unavailable" || (availability !== "Both" && availability.toLowerCase() !== context.shiftName))
              return false;
          if ((stats.days[worker.id] || 0) >= worker.maxDays)
              return false;
          return worker.noHourLimits || (stats.hours[worker.id] || 0) + shiftDuration(worker, context.shiftName) <= worker.maxWeeklyHours;
      }
      function canWorkIgnoringHours(worker, context, stats) {
          if (!worker.active || !worker.availability.includes(context.day) || context.assignedToday.has(worker.id))
              return false;
          const availability = worker.shiftAvailability[context.day] || "Both";
          if (availability === "Unavailable" || (availability !== "Both" && availability.toLowerCase() !== context.shiftName))
              return false;
          return (stats.days[worker.id] || 0) < worker.maxDays;
      }
      function rankWorkers(workers, stats, assigned = []) {
          const hasStrongWorker = assigned.some((worker) => worker.skillRating >= 7);
          const hasLowWorker = assigned.some((worker) => worker.skillRating <= 4);
          return [...workers].sort((a, b) => {
              const aHours = stats.hours[a.id] || 0;
              const bHours = stats.hours[b.id] || 0;
              if (aHours !== bHours)
                  return aHours - bHours;
              if (!hasStrongWorker || hasLowWorker) {
                  if (a.skillRating !== b.skillRating)
                      return b.skillRating - a.skillRating;
              }
              else if (a.skillRating !== b.skillRating) {
                  return a.skillRating - b.skillRating;
              }
              const aGap = a.noHourLimits ? 0 : Math.max(0, a.preferredWeeklyHours - aHours);
              const bGap = b.noHourLimits ? 0 : Math.max(0, b.preferredWeeklyHours - bHours);
              if (aGap !== bGap)
                  return bGap - aGap;
              return a.name.localeCompare(b.name);
          });
      }
      function availableWorkers(workers, context, stats) {
          return workers.filter((worker) => canWork(worker, context, stats));
      }
      function availableLeadCount(workers, context, stats) {
          return availableWorkers(workers, context, stats).filter((worker) => worker.isManager).length;
      }
      function rankLeadCandidates(workers, contexts, context, stats) {
          return rankWorkers(workers, stats, context.assigned).sort((a, b) => {
              const aOptions = contexts.filter((item) => item.needed > 0 && !item.assigned.some((worker) => worker.isManager) && canWork(a, item, stats)).length;
              const bOptions = contexts.filter((item) => item.needed > 0 && !item.assigned.some((worker) => worker.isManager) && canWork(b, item, stats)).length;
              if (aOptions !== bOptions)
                  return aOptions - bOptions;
              return 0;
          });
      }
      function rankFillCandidates(workers, context, stats) {
          const candidates = rankWorkers(availableWorkers(workers, context, stats), stats, context.assigned);
          const nonLeads = candidates.filter((worker) => !worker.isManager);
          return nonLeads.length ? nonLeads : candidates;
      }
      function assign(worker, context, stats) {
          context.assigned.push(worker);
          context.assignedToday.add(worker.id);
          stats.days[worker.id] = (stats.days[worker.id] || 0) + 1;
          stats.hours[worker.id] = (stats.hours[worker.id] || 0) + shiftDuration(worker, context.shiftName);
      }
      function toAssignedWorker(worker, shiftName, mealBreakHours) {
          const { start, end } = worker.shiftTimes[shiftName];
          const durationHours = (0, time_1.getShiftDurationHours)(start, end);
          return { assignmentId: (0, ids_1.createId)(), id: worker.id, name: worker.name, position: worker.position, role: worker.role, isManager: worker.isManager, start, end, timeRange: (0, time_1.formatTime)(start) + "-" + (0, time_1.formatTime)(end), durationHours, needsLunch: durationHours >= mealBreakHours };
      }
      function explainNoCandidates(context, workers, stats) {
          const active = workers.filter((worker) => worker.active);
          const label = context.day + " " + context.shiftName;
          if (!active.length)
              return "No active employees are available to schedule.";
          if (!active.some((worker) => worker.availability.includes(context.day)))
              return "No employee available for " + label + ".";
          const shiftAvailable = active.filter((worker) => {
              const availability = worker.shiftAvailability[context.day] || "Both";
              return worker.availability.includes(context.day) && availability !== "Unavailable" && (availability === "Both" || availability.toLowerCase() === context.shiftName);
          });
          if (!shiftAvailable.length)
              return "No employee available for " + label + ".";
          if (shiftAvailable.every((worker) => context.assignedToday.has(worker.id)))
              return "Available employees are already assigned another shift on " + context.day + ".";
          if (!shiftAvailable.some((worker) => canWorkIgnoringHours(worker, context, stats)))
              return "Maximum days prevented full staffing for " + label + ".";
          if (!shiftAvailable.some((worker) => worker.noHourLimits || (stats.hours[worker.id] || 0) + shiftDuration(worker, context.shiftName) <= worker.maxWeeklyHours))
              return "Hour limits prevented full staffing for " + label + ".";
          return "Not enough available workers for " + label + ".";
      }
      function generateSchedule(state) {
          const stats = { hours: {}, days: {} };
          const warningsByDay = new Map();
          const contexts = [];
          Object.keys(state.rules.staffing).forEach((day) => {
              const assignedToday = new Set();
              const warnings = [];
              warningsByDay.set(day, warnings);
              ["open", "close"].forEach((shiftName) => contexts.push({ day, shiftName, needed: state.rules.staffing[day]?.[shiftName] ?? 0, assigned: [], assignedToday, warnings }));
          });
          const leadContexts = contexts.filter((context) => context.needed > 0).sort((a, b) => availableLeadCount(state.workers, a, stats) - availableLeadCount(state.workers, b, stats));
          leadContexts.forEach((context) => {
              const lead = rankLeadCandidates(state.workers.filter((worker) => worker.isManager && canWork(worker, context, stats)), contexts, context, stats)[0];
              if (lead)
                  assign(lead, context, stats);
          });
          let filled = true;
          while (filled) {
              filled = false;
              const shortContexts = contexts
                  .filter((context) => context.assigned.length < context.needed)
                  .sort((a, b) => availableWorkers(state.workers, a, stats).length - availableWorkers(state.workers, b, stats).length);
              for (const context of shortContexts) {
                  const next = rankFillCandidates(state.workers, context, stats)[0];
                  if (!next)
                      continue;
                  assign(next, context, stats);
                  filled = true;
              }
          }
          contexts.forEach((context) => {
              if (context.needed > 0 && !context.assigned.some((worker) => worker.isManager)) {
                  const leadReason = availableLeadCount(state.workers, context, stats) ? "Lead coverage was blocked by other assignments for " : "No Lead available for ";
                  context.warnings.push(leadReason + context.day + " " + context.shiftName + ".");
              }
              if (context.assigned.length < context.needed)
                  context.warnings.push(explainNoCandidates(context, state.workers, stats) + " " + context.assigned.length + " of " + context.needed + " filled.");
          });
          const days = Object.keys(state.rules.staffing).map((day, index) => {
              const shifts = {};
              ["open", "close"].forEach((shiftName) => {
                  const context = contexts.find((item) => item.day === day && item.shiftName === shiftName);
                  const hasLead = context.assigned.some((worker) => worker.isManager);
                  shifts[shiftName] = { name: shiftName, needed: context.needed, time: shiftName === "open" ? state.rules.openShift : state.rules.closeShift, assigned: context.assigned.map((worker) => toAssignedWorker(worker, shiftName, state.rules.mealBreakHours)), hasQualified: hasLead, hasManager: hasLead };
              });
              return { day, date: (0, time_1.addDays)(state.rules.weekStart, index), shifts, warnings: warningsByDay.get(day) };
          });
          return { createdAt: new Date().toISOString(), days };
      }
    },
    "src/renderer/modules/settings/settings.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.applyTheme = applyTheme;
      function applyTheme(settings) { document.documentElement.dataset.theme = settings.darkMode ? "dark" : "light"; }
    },
    "src/renderer/shared/dom.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.byId = byId;
      exports.escapeHtml = escapeHtml;
      function byId(id) { const element = document.getElementById(id); if (!element)
          throw new Error("Missing required element #" + id); return element; }
      function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
    },
    "src/renderer/shared/ids.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createId = createId;
      function createId() {
          if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
              return globalThis.crypto.randomUUID();
          }
          if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
              const bytes = new Uint8Array(16);
              globalThis.crypto.getRandomValues(bytes);
              bytes[6] = (bytes[6] & 0x0f) | 0x40;
              bytes[8] = (bytes[8] & 0x3f) | 0x80;
              const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
              return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
          }
          return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }
    },
    "src/shared/defaults.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.defaultRules = defaultRules;
      exports.defaultSettings = defaultSettings;
      exports.defaultAppState = defaultAppState;
      exports.defaultWorkerShiftTimes = defaultWorkerShiftTimes;
      exports.normalizeWorker = normalizeWorker;
      const types_1 = require("./types");
      const time_1 = require("./time");
      function defaultRules() {
          return {
              weekStart: "",
              openShift: "08:00",
              closeShift: "16:00",
              shiftHours: 8,
              mealBreakHours: 6,
              staffing: types_1.DAYS.reduce((days, day) => {
                  days[day] = { open: 2, close: 2 };
                  return days;
              }, {})
          };
      }
      function defaultSettings() {
          return { darkMode: false, confirmBeforeClose: true };
      }
      function defaultAppState() {
          return { workers: [], rules: defaultRules(), schedule: null, scheduleHistory: [] };
      }
      function defaultWorkerShiftTimes(rules) {
          const hours = Number(rules.shiftHours) || 8;
          return {
              open: { start: rules.openShift || "08:00", end: (0, time_1.addHoursToTime)(rules.openShift || "08:00", hours) },
              close: { start: rules.closeShift || "16:00", end: (0, time_1.addHoursToTime)(rules.closeShift || "16:00", hours) }
          };
      }
      function normalizeRole(role, position, isManager) {
          if (role === "Manager" || role === "Lead" || isManager)
              return "Lead";
          if (role === "Lead")
              return "Lead";
          if (position.toLowerCase().includes("lead"))
              return "Lead";
          return "Crew";
      }
      function normalizeWorker(worker, rules) {
          const rawPosition = String(worker.position || worker.role || "Crew");
          const position = rawPosition.toLowerCase() === "manager" ? "Lead" : rawPosition;
          const isManager = Boolean(worker.isManager || String(worker.role) === "Manager" || worker.role === "Lead");
          const role = normalizeRole(worker.role, position, isManager);
          const maxWeeklyHours = Number(worker.maxWeeklyHours || 40);
          const availability = worker.availability || [];
          const shiftAvailability = types_1.DAYS.reduce((result, day) => {
              const value = worker.shiftAvailability?.[day];
              result[day] = availability.includes(day) ? (value === "Open" || value === "Close" || value === "Both" ? value : "Both") : "Unavailable";
              return result;
          }, {});
          const defaultTimes = defaultWorkerShiftTimes(rules);
          const timeValue = (value, fallback) => /^\d{2}:\d{2}$/.test(String(value || "")) ? String(value) : fallback;
          return {
              id: worker.id,
              employeeCode: /^\d{4}$/.test(String(worker.employeeCode || "")) ? String(worker.employeeCode) : "",
              name: String(worker.name || "Unnamed Worker"),
              position,
              role,
              isManager: role === "Lead" || isManager,
              skillRating: Math.min(10, Math.max(1, Number(worker.skillRating) || 5)),
              noHourLimits: Boolean(worker.noHourLimits),
              maxWeeklyHours,
              preferredWeeklyHours: Number(worker.preferredWeeklyHours || Math.min(maxWeeklyHours, 32)),
              maxDays: Number(worker.maxDays || 7),
              active: worker.active !== false,
              notes: String(worker.notes || ""),
              availability,
              shiftAvailability,
              shiftTimes: {
                  open: { start: timeValue(worker.shiftTimes?.open?.start, defaultTimes.open.start), end: timeValue(worker.shiftTimes?.open?.end, defaultTimes.open.end) },
                  close: { start: timeValue(worker.shiftTimes?.close?.start, defaultTimes.close.start), end: timeValue(worker.shiftTimes?.close?.end, defaultTimes.close.end) }
              }
          };
      }
    },
    "src/shared/time.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.timeToMinutes = timeToMinutes;
      exports.addHoursToTime = addHoursToTime;
      exports.getShiftDurationHours = getShiftDurationHours;
      exports.formatTime = formatTime;
      exports.formatDuration = formatDuration;
      exports.nextMonday = nextMonday;
      exports.addDays = addDays;
      exports.formatDate = formatDate;
      function timeToMinutes(value) {
          const [hourText, minuteText] = String(value || "00:00").split(":");
          return (Number(hourText) || 0) * 60 + (Number(minuteText) || 0);
      }
      function addHoursToTime(value, hours) {
          const total = (timeToMinutes(value) + Math.round(hours * 60)) % (24 * 60);
          const hour = Math.floor(total / 60);
          const minute = total % 60;
          return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
      }
      function getShiftDurationHours(start, end) {
          const startMinutes = timeToMinutes(start);
          let endMinutes = timeToMinutes(end);
          if (endMinutes <= startMinutes)
              endMinutes += 24 * 60;
          return (endMinutes - startMinutes) / 60;
      }
      function formatTime(value) {
          const [hourText, minuteText] = String(value || "00:00").split(":");
          const hour = Number(hourText) || 0;
          const minute = Number(minuteText) || 0;
          const suffix = hour >= 12 ? "PM" : "AM";
          const displayHour = hour % 12 || 12;
          return displayHour + ":" + String(minute).padStart(2, "0") + " " + suffix;
      }
      function formatDuration(hours) {
          const whole = Math.floor(hours);
          const minutes = Math.round((hours - whole) * 60);
          if (!minutes)
              return whole + " hr" + (whole === 1 ? "" : "s");
          return whole + " hr " + minutes + " min";
      }
      function nextMonday() {
          const date = new Date();
          const day = date.getDay();
          const distance = (8 - day) % 7 || 7;
          date.setDate(date.getDate() + distance);
          return date.toISOString().slice(0, 10);
      }
      function addDays(dateString, days) {
          const date = new Date(dateString + "T12:00:00");
          date.setDate(date.getDate() + days);
          return date.toISOString();
      }
      function formatDate(dateString) {
          return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateString));
      }
    },
    "src/shared/types.ts": function(require, exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SHORT_DAYS = exports.DAYS = void 0;
      exports.DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      exports.SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    }
  };
  const dependencies = {
  "src/renderer/app.ts": {
    "./browserBridge": "src/renderer/browserBridge.ts",
    "../shared/defaults": "src/shared/defaults.ts",
    "../shared/types": "src/shared/types.ts",
    "../shared/time": "src/shared/time.ts",
    "./modules/employees/employees": "src/renderer/modules/employees/employees.ts",
    "./modules/availability/availability": "src/renderer/modules/availability/availability.ts",
    "./modules/scheduling/scheduler": "src/renderer/modules/scheduling/scheduler.ts",
    "./modules/scheduling/scheduleEditor": "src/renderer/modules/scheduling/scheduleEditor.ts",
    "./modules/reports/reports": "src/renderer/modules/reports/reports.ts",
    "./modules/settings/settings": "src/renderer/modules/settings/settings.ts",
    "./shared/dom": "src/renderer/shared/dom.ts",
    "./shared/ids": "src/renderer/shared/ids.ts",
    "./modules/auth/login": "src/renderer/modules/auth/login.ts"
  },
  "src/renderer/browserBridge.ts": {
    "../shared/defaults": "src/shared/defaults.ts",
    "../shared/types": "src/shared/types.ts"
  },
  "src/renderer/modules/auth/login.ts": {},
  "src/renderer/modules/availability/availability.ts": {
    "../../../shared/types": "src/shared/types.ts"
  },
  "src/renderer/modules/employees/employees.ts": {
    "../../shared/ids": "src/renderer/shared/ids.ts",
    "../../../shared/defaults": "src/shared/defaults.ts",
    "../../../shared/types": "src/shared/types.ts"
  },
  "src/renderer/modules/reports/reports.ts": {
    "../../../shared/types": "src/shared/types.ts"
  },
  "src/renderer/modules/scheduling/scheduleEditor.ts": {
    "../../../shared/time": "src/shared/time.ts",
    "../../../shared/types": "src/shared/types.ts",
    "../../shared/ids": "src/renderer/shared/ids.ts"
  },
  "src/renderer/modules/scheduling/scheduler.ts": {
    "../../../shared/time": "src/shared/time.ts",
    "../../../shared/types": "src/shared/types.ts",
    "../../shared/ids": "src/renderer/shared/ids.ts"
  },
  "src/renderer/modules/settings/settings.ts": {
    "../../../shared/types": "src/shared/types.ts"
  },
  "src/renderer/shared/dom.ts": {},
  "src/renderer/shared/ids.ts": {},
  "src/shared/defaults.ts": {
    "./types": "src/shared/types.ts",
    "./time": "src/shared/time.ts"
  },
  "src/shared/time.ts": {},
  "src/shared/types.ts": {}
};
  const cache = {};

  function requireModule(id) {
    if (cache[id]) return cache[id].exports;
    const factory = modules[id];
    if (!factory) throw new Error("Renderer module not found: " + id);
    const module = { exports: {} };
    cache[id] = module;
    const localRequire = (request) => requireModule(dependencies[id][request]);
    factory(localRequire, module.exports);
    return module.exports;
  }

  requireModule("src/renderer/app.ts");
})();
