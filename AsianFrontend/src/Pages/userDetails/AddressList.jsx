// components/userDetails/AddressList.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import styles from "../../Styles/userDetails/AddressList.module.css";
import AddressModal from "../../Modals/AddressModal";
import api from "../../services/axiosConfig";

const AddressList = ({ userId, addresses = [], onAddressesUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowModal(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = async (addressData) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      let response;
      if (editingAddress) {
        response = await api.put(
          `/user/address/${userId}/${editingAddress._id}`,
          addressData
        );
      } else {
        response = await api.post(`/user/address/${userId}`, addressData);
      }

      if (response.data.success) {
        onAddressesUpdate(response.data.addresses);
        handleCloseModal();
        toast.success(
          editingAddress
            ? "Address updated successfully!"
            : "Address added successfully!"
        );
      }
    } catch (err) {
      console.error("Error saving address:", err);
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to remove this address?")) {
      return;
    }

    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      const response = await api.delete(`/user/address/${userId}/${addressId}`);
      if (response.data.success) {
        onAddressesUpdate(response.data.addresses);
        toast.success("Address removed successfully!");
      }
    } catch (err) {
      console.error("Error removing address:", err);
      toast.error(err.response?.data?.message || "Failed to remove address");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDefault = async (addressId) => {
    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      const response = await api.patch(
        `/user/address/${userId}/${addressId}/default`
      );
      if (response.data.success) {
        onAddressesUpdate(response.data.addresses);
        toast.success("Default address updated!");
      }
    } catch (err) {
      console.error("Error setting default address:", err);
      toast.error(
        err.response?.data?.message || "Failed to set default address"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.sectionTitle}>My Address</h2>

      {addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No addresses saved yet.</p>
          <button className={styles.addBtn} onClick={handleAddNewAddress}>
            + Add New Address
          </button>
        </div>
      ) : (
        <>
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`${styles.card} ${
                address.isDefault ? styles.defaultCard : ""
              }`}
            >
              {address.isDefault && (
                <div className={styles.defaultBadge}>Default</div>
              )}

              <p className={styles.address}>
                {address.address}
                <br />
                {address.city && `${address.city}, `}
                {address.state} - {address.pincode}
                <br />
                Mob : {address.mobile}
              </p>

              {!address.isDefault && (
                <button
                  className={styles.defaultBtn}
                  onClick={() => handleMakeDefault(address._id)}
                  disabled={loading}
                >
                  Make this default
                </button>
              )}

              <div className={styles.actions}>
                <button
                  className={styles.editBtn}
                  onClick={() => handleEditAddress(address)}
                  disabled={loading}
                >
                  EDIT ADDRESS
                </button>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemoveAddress(address._id)}
                  disabled={loading}
                >
                  REMOVE
                </button>
              </div>
            </div>
          ))}

          <button
            className={styles.addBtn}
            onClick={handleAddNewAddress}
            disabled={loading}
          >
            + Add New Address
          </button>
        </>
      )}

      {/* Address Modal - Slides from bottom right */}
      <AddressModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveAddress}
        address={editingAddress}
        loading={loading}
      />
    </div>
  );
};

export default AddressList;
