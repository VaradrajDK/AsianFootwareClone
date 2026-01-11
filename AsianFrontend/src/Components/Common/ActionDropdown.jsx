// Components/Common/ActionDropdown.jsx
import React, { useState, useEffect, useRef } from "react";
import styles from "../../Styles/Common/ActionDropdown.module.css";
import { FiMoreVertical } from "react-icons/fi";

const ActionDropdown = ({ actions, align = "right" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = actions.length * 48 + 40; // Approximate height

      // If not enough space below, open upward
      setOpenUpward(spaceBelow < dropdownHeight);
    }
  }, [isOpen, actions.length]);

  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button
        ref={triggerRef}
        className={`${styles.dropdownTrigger} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="More actions"
        type="button"
      >
        <FiMoreVertical size={18} />
      </button>

      {isOpen && (
        <div
          className={`${styles.dropdownMenu} ${
            openUpward ? styles.dropdownMenuUp : styles.dropdownMenuDown
          } ${styles[`align-${align}`]}`}
        >
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action.divider ? (
                <div className={styles.dropdownDivider}></div>
              ) : (
                <button
                  className={`${styles.dropdownItem} ${
                    action.variant ? styles[action.variant] : ""
                  } ${action.disabled ? styles.disabled : ""}`}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  type="button"
                >
                  {action.icon && (
                    <span className={styles.dropdownIcon}>{action.icon}</span>
                  )}
                  <span className={styles.dropdownLabel}>{action.label}</span>
                  {action.badge && (
                    <span className={styles.dropdownBadge}>{action.badge}</span>
                  )}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionDropdown;
