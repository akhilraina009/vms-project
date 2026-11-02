/**
 * Utility functions to strictly classify visits/pre-approvals as IT or General.
 */

export const isITApproval = (item, visitorList = [], hostList = []) => {
  if (!item) return false;

  // 1. Explicit Purpose Checks
  const purpose = String(item.purpose || "").toUpperCase().trim();
  if (
    purpose.includes("[IT_VISIT]") ||
    purpose.includes("IT_VISIT") ||
    purpose.startsWith("[IT") ||
    purpose === "IT" ||
    purpose.startsWith("IT ") ||
    purpose.endsWith(" IT") ||
    purpose.includes(" IT ") ||
    purpose.includes("SERVER") ||
    purpose.includes("DATACENTER") ||
    purpose.includes("DATA CENTER") ||
    purpose.includes("RACK") ||
    purpose.includes("FIBER") ||
    purpose.includes("NETWORK") ||
    purpose.includes("HARDWARE") ||
    purpose.includes("FIRMWARE") ||
    purpose.includes("SWITCH") ||
    purpose.includes("COMMISSIONING")
  ) {
    return true;
  }

  // 2. Host Department Check
  const host =
    item.host_employee ||
    item.host ||
    (Array.isArray(hostList) && hostList.find((h) => String(h.employee_id) === String(item.host_employee_id)));
  const hostDept = String(host?.department || item.department || "").trim().toUpperCase();
  if (hostDept === "IT" || hostDept.includes("INFORMATION TECH")) {
    return true;
  }

  // 3. Visitor Category / Department / Company Check
  const visitor =
    item.visitor ||
    (Array.isArray(visitorList) && visitorList.find((v) => String(v.visitor_id) === String(item.visitor_id)));
  const visCategory = String(visitor?.category || item.category || "").trim().toUpperCase();
  const visCompany = String(visitor?.company_name || "").trim().toUpperCase();
  const visDept = String(visitor?.department || "").trim().toUpperCase();

  if (visCategory === "IT" || visCompany === "IT" || visDept === "IT") {
    return true;
  }

  return false;
};

