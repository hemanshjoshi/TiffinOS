import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react-native';

type CustomizationModalProps = {
  visible: boolean;
  item: any;
  onClose: () => void;
  onAdd: (item: any, variant: any, addons: any[]) => void;
};

export default function CustomizationModal({ visible, item, onClose, onAdd }: CustomizationModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);

  useEffect(() => {
    if (visible && item) {
      // Default to first variant if available, or none
      if (item.variants && item.variants.length > 0) {
        setSelectedVariant(item.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setSelectedAddons([]);
    }
  }, [visible, item]);

  if (!item) return null;

  const toggleAddon = (addon: any) => {
    if (selectedAddons.find((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const calculateTotal = () => {
    let total = selectedVariant ? selectedVariant.price : item.price;
    selectedAddons.forEach((addon) => {
      total += addon.price;
    });
    return total;
  };

  const handleAddItem = () => {
    onAdd(item, selectedVariant, selectedAddons);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{item.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#000" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Variants Section */}
            {item.variants && item.variants.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Portion</Text>
                <Text style={styles.sectionSubtitle}>Required • Select 1</Text>
                {item.variants.map((variant: any, idx: number) => (
                  <TouchableOpacity
                    key={variant.id || `variant-${idx}`}
                    style={styles.optionRow}
                    onPress={() => setSelectedVariant(variant)}
                  >
                    <View style={styles.radioContainer}>
                        <View style={[
                            styles.radioOuter, 
                            selectedVariant?.id === variant.id && styles.radioActiveBorder
                        ]}>
                            {selectedVariant?.id === variant.id && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.optionName}>{variant.name}</Text>
                    </View>
                    <Text style={styles.optionPrice}>₹{variant.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Addons Section */}
            {item.addons && item.addons.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add-ons</Text>
                <Text style={styles.sectionSubtitle}>Optional • Select multiple</Text>
                {item.addons.map((addon: any, idx: number) => {
                  const isSelected = selectedAddons.find((a) => a.id === addon.id);
                  return (
                    <TouchableOpacity
                      key={addon.id || `addon-${idx}`}
                      style={styles.optionRow}
                      onPress={() => toggleAddon(addon)}
                    >
                      <View style={styles.checkboxContainer}>
                          <View style={[
                              styles.checkbox,
                              isSelected && styles.checkboxActive
                          ]}>
                              {isSelected && <Check size={12} color="#fff" />}
                          </View>
                          <Text style={styles.optionName}>{addon.name}</Text>
                      </View>
                      <Text style={styles.optionPrice}>₹{addon.price}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Text style={styles.addButtonText}>Add item ₹{calculateTotal()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioActiveBorder: {
    borderColor: Colors.success,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  optionName: {
    fontSize: 16,
    color: Colors.text,
  },
  optionPrice: {
    fontSize: 16,
    color: Colors.text,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addButton: {
    backgroundColor: Colors.success,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
