export const getUser = () => {
  try {
    const isAuth = localStorage.getItem("qp_auth") === "true";
    if (!isAuth) return null;
    return JSON.parse(localStorage.getItem("qp_current_user"));
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  localStorage.setItem("qp_current_user", JSON.stringify(user));
  localStorage.setItem("qp_auth", "true");
};

export const clearUser = () => {
  localStorage.removeItem("qp_auth");
  localStorage.removeItem("qp_current_user");
};

export const getTemplates = () => {
  try {
    return JSON.parse(localStorage.getItem("qp_templates")) || [];
  } catch {
    return [];
  }
};

export const saveTemplates = (templates) => {
  localStorage.setItem("qp_templates", JSON.stringify(templates));
};

export const saveTemplate = (template) => {
  const templates = getTemplates();
  const nextTemplate = {
    ...template,
    id: template.id || Date.now(),
    date: template.date || new Date().toLocaleDateString(),
  };
  const exists = templates.some((item) => String(item.id) === String(nextTemplate.id));
  const nextTemplates = exists
    ? templates.map((item) => (String(item.id) === String(nextTemplate.id) ? nextTemplate : item))
    : [nextTemplate, ...templates];
  saveTemplates(nextTemplates);
  return nextTemplate;
};

export const getPapers = () => {
  try {
    return JSON.parse(localStorage.getItem("qp_papers")) || [];
  } catch {
    return [];
  }
};

export const savePaper = (paper) => {
  const papers = getPapers();
  papers.unshift(paper);
  localStorage.setItem("qp_papers", JSON.stringify(papers));
};

export const getDefaults = () => {
  try {
    return JSON.parse(localStorage.getItem("qp_defaults")) || {
      subject: "Physics",
      grade: "10",
      duration: 90,
      totalMarks: 50,
    };
  } catch {
    return {
      subject: "Physics",
      grade: "10",
      duration: 90,
      totalMarks: 50,
    };
  }
};

export const saveDefaults = (defaults) => {
  localStorage.setItem("qp_defaults", JSON.stringify(defaults));
  return defaults;
};

export const clearAll = () => {
  clearUser();
  localStorage.removeItem("qp_templates");
  localStorage.removeItem("qp_papers");
  localStorage.removeItem("qp_defaults");
};
