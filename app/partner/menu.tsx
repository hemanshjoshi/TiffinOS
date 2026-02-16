import { View, Text, StyleSheet, FlatList, Switch, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Plus, Search, X } from 'lucide-react-native';
import { usePartnerKitchen } from '@/hooks/usePartnerKitchen';

export default function PartnerMenu() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [masterItems, setMasterItems] = useState<any[]>([]);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { kitchenId } = usePartnerKitchen();

  useEffect(() => {
    if (kitchenId) {
        fetchMenu();
    }
  }, [kitchenId]);

  const fetchMenu = async () => {
    if (!kitchenId) return;
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        master_menu_items (name, category)
      `)
      .eq('kitchen_id', kitchenId);

    if (error) console.error(error);
    else setMenuItems(data || []);
  };

  const toggleAvailability = async (id: string, currentValue: boolean) => {
      // Optimistic
      setMenuItems(items => items.map(i => i.id === id ? {...i, is_available: !currentValue} : i));
      
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentValue })
        .eq('id', id);
        
      if (error) {
          console.error(error);
          fetchMenu(); // Revert
      }
  };

  const fetchMasterItems = async () => {
      const { data } = await supabase.from('master_menu_items').select('*');
      setMasterItems(data || []);
  };

  const openAddModal = () => {
      fetchMasterItems();
      setAddModalVisible(true);
  };

  const addItemToMenu = async (masterItem: any) => {
      if (!kitchenId) return;
      
      // Add with default price 150 for demo
      const { error } = await supabase.from('menu_items').insert({
          kitchen_id: kitchenId,
          master_item_id: masterItem.id,
          price: 150,
          image_url: masterItem.default_image_url || 'https://via.placeholder.com/150',
          is_available: true
      });

      if (!error) {
          setAddModalVisible(false);
          fetchMenu();
      }
  };

  const renderMenuItem = ({ item }: { item: any }) => {
      const name = item.master_menu_items?.name || item.name;
      const category = item.master_menu_items?.category || 'General';

      return (
        <View style={styles.card}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.category}>{category}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
            </View>
            <Switch 
                value={item.is_available} 
                onValueChange={() => toggleAvailability(item.id, item.is_available)}
                trackColor={{ false: "#767577", true: Colors.success }}
            />
        </View>
      );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.title}>Menu Management</Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
              <Plus size={24} color="#fff" />
          </TouchableOpacity>
      </View>

      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal visible={isAddModalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Item from Master Index</Text>
                  <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                      <X size={24} color="#000" />
                  </TouchableOpacity>
              </View>
              <View style={styles.searchBox}>
                  <Search size={20} color="#666" />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Search Master Index..." 
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
              </View>
              <FlatList 
                  data={masterItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                  keyExtractor={i => i.id}
                  renderItem={({ item }) => (
                      <TouchableOpacity style={styles.masterItem} onPress={() => addItemToMenu(item)}>
                          <Text style={styles.masterName}>{item.name}</Text>
                          <Text style={styles.masterCategory}>{item.category}</Text>
                          <Plus size={20} color={Colors.primary} />
                      </TouchableOpacity>
                  )}
              />
          </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  category: {
    fontSize: 12,
    color: '#666',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 4,
  },
  modalContainer: {
      flex: 1,
      backgroundColor: '#fff',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
  },
  searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      margin: 16,
      padding: 12,
      borderRadius: 8,
  },
  input: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
  },
  masterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  masterName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
  },
  masterCategory: {
      fontSize: 12,
      color: '#666',
      marginRight: 12,
  },
});
