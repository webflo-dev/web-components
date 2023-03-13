class AmalgoBox extends HTMLElement {
  get input() {
    return this.querySelector("input");
  }

  get button() {
    return this.querySelector("button");
  }

  get popover() {
    return this.querySelector("amalgo-popover");
  }

  get allOptions() {
    return Array.from(this.querySelectorAll("amalgo-option"));
  }

  get visibleOptions() {
    return Array.from(this.querySelectorAll("amalgo-option:not([hidden])"));
  }

  get highlightedIndex() {
    let activeElement = this.querySelector("amalgo-option[highlight]");
    return activeElement ? this.visibleOptions.indexOf(activeElement) : -1;
  }

  toggle() {
    if (this.hasAttribute("open")) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.setAttribute("open", "");
    this.button.setAttribute("aria-expanded", "true");

    this.addEventListener("keydown", this.keydownEvent);
    this.highlightInitial();
    this.input.focus();

    document.body.style.overflow = "hidden";
    document.addEventListener("mousedown", this.documentOuterEvent);
    document.addEventListener("touchstart", this.documentOuterEvent);
    document.addEventListener("focusin", this.documentOuterEvent);
  }

  close() {
    this.removeAttribute("open");
    this.button.setAttribute("aria-expanded", "false");
    this.clearHighlighted();
    this.removeEventListener("keydown", this.keydownEvent);

    document.body.style.overflow = "";
    document.removeEventListener("mousedown", this.documentOuterEvent);
    document.removeEventListener("touchstart", this.documentOuterEvent);
    document.removeEventListener("focusin", this.documentOuterEvent);
  }

  highlightInitial() {
    let highlightValue = this.getAttribute("highlight");
    let option = this.querySelector(`amalgo-option[value="${highlightValue}"]`);
    if (option) {
      this.highlightOption(option);
    }
  }

  filter(query) {
    for (let option of this.allOptions) {
      let text = option.textContent?.trim().toLowerCase() || "";
      let matches = text.includes(query.trim().toLowerCase());
      if (matches) {
        option.hidden = false;
      } else {
        option.hidden = true;
      }
    }
  }

  keydownEvent = (event) => {
    switch (event.key) {
      case "ArrowDown":
        this.cycleHighlight(1);
        event.preventDefault();
        break;
      case "ArrowUp":
        this.cycleHighlight(-1);
        event.preventDefault();
        break;
      case "Enter":
        this.selectHighlighted();
        break;
      case "Escape":
        this.close();
        this.button.focus();
        break;
    }
  };

  cycleHighlight(which) {
    let nextOption = this.visibleOptions[this.highlightedIndex + which];
    if (nextOption) {
      this.highlightOption(nextOption);
    }
  }

  highlightOption(option) {
    this.clearHighlighted();
    option.setAttribute("highlight", "");
    this.input.setAttribute("aria-activedescendant", option.id);
  }

  selectHighlighted() {
    let option = this.visibleOptions[this.highlightedIndex];
    if (option) {
      this.select(option);
    }
  }

  documentOuterEvent = (event) => {
    let interactedInside =
      event.target instanceof Node && this.contains(event.target);

    if (!interactedInside) {
      this.close();
    }
  };

  clearHighlighted() {
    this.querySelector("amalgo-option[highlight]")?.removeAttribute(
      "highlight"
    );
  }

  select(option) {
    const result = this.dispatchEvent(
      new CustomEvent("onoptionselect", {
        detail: option.getAttribute("value"),
      })
    );
    this.close();
    // let focus rest, otherwise "keyup" will be fired on the button when
    // selecting with keyboard "Enter" and the button will be "clicked" again,
    // opening the menu
    requestAnimationFrame(() => {
      this.button.focus();
    });
  }
}

class AmalgoElement extends HTMLElement {
  get root() {
    return this.closest("amalgo-box");
  }
}

class Button extends AmalgoElement {
  get button() {
    return this.querySelector("button");
  }

  connectedCallback() {
    this.button.setAttribute("aria-haspopup", "menu");
    this.button.addEventListener("click", () => {
      this.root.toggle();
    });
  }
}

class Input extends AmalgoElement {
  get input() {
    return this.querySelector("input");
  }

  connectedCallback() {
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-autocomplete", "list");
    this.input.setAttribute("aria-expanded", "true");
    this.input.addEventListener("input", () => {
      this.root.filter(this.input.value);
    });
  }
}

class Popover extends AmalgoElement {
  connectedCallback() {
    this.id = "popover-" + Math.random().toString(36).slice(2);
    this.root.button.setAttribute("aria-controls", this.id);
  }
}

class Menu extends AmalgoElement {
  connectedCallback() {
    this.id = "menu-" + Math.random().toString(36).slice(2);
    this.setAttribute("role", "listbox");

    this.root.input.setAttribute("aria-controls", this.id);
  }
}

class Option extends AmalgoElement {
  connectedCallback() {
    this.id = "option-" + Math.random().toString(36).slice(2);
    this.setAttribute("role", "option");

    this.addEventListener("mouseenter", () => {
      this.root.highlightOption(this);
    });

    this.addEventListener("click", () => {
      this.root.select(this);
    });
  }
}

window.customElements.define("amalgo-box", AmalgoBox);
window.customElements.define("amalgo-button", Button);
window.customElements.define("amalgo-input", Input);
window.customElements.define("amalgo-popover", Popover);
window.customElements.define("amalgo-menu", Menu);
window.customElements.define("amalgo-option", Option);
