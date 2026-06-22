import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Header } from '../../src/components/Header';
import { useSettingsStore } from '../../src/stores/useSettingsStore';

const newWordsOptions = [10, 20, 30, 50, 100, 200];
const reviewLimitOptions = [50, 100, 200, 300, 500];

interface NumberPickerProps {
  visible: boolean;
  title: string;
  subtitle: string;
  options: number[];
  currentValue: number;
  onSelect: (value: number) => void;
  onClose: () => void;
}

function NumberPicker({ visible, title, subtitle, options, currentValue, onSelect, onClose }: NumberPickerProps) {
  const [selected, setSelected] = useState(currentValue);
  const [customValue, setCustomValue] = useState('');

  const handleConfirm = () => {
    if (customValue) {
      const num = parseInt(customValue, 10);
      if (isNaN(num) || num < 1) {
        Alert.alert('提示', '请输入有效的数字');
        return;
      }
      if (num > 1000) {
        Alert.alert('提示', '数量不能超过 1000');
        return;
      }
      onSelect(num);
    } else {
      onSelect(selected);
    }
    setCustomValue('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalSubtitle}>{subtitle}</Text>
          </View>

          {/* Options Grid */}
          <View style={styles.optionsGrid}>
            {options.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.optionBtn,
                  selected === count && styles.optionBtnActive,
                ]}
                onPress={() => {
                  setSelected(count);
                  setCustomValue('');
                }}
              >
                <Text style={[
                  styles.optionBtnText,
                  selected === count && styles.optionBtnTextActive,
                ]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input */}
          <Text style={styles.customLabel}>自定义数量</Text>
          <TextInput
            style={styles.customInput}
            value={customValue}
            onChangeText={(text) => {
              setCustomValue(text);
              if (text) setSelected(0);
            }}
            placeholder="输入自定义词数"
            keyboardType="number-pad"
            maxLength={4}
          />

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>确认</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    selectedBookId,
    newWordsPerDay,
    reviewLimitPerDay,
    darkMode,
    setNewWordsPerDay,
    setReviewLimitPerDay,
    toggleDarkMode,
  } = useSettingsStore();

  const [showNewWordsPicker, setShowNewWordsPicker] = useState(false);
  const [showReviewPicker, setShowReviewPicker] = useState(false);

  return (
    <View style={styles.container}>
      <Header title="设置" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Book Section */}
        <Text style={styles.sectionTitle}>词书</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/book')}>
            <Text style={styles.rowLabel}>当前词书</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>考研核心词汇</Text>
              <MaterialIcons name="chevron-right" size={20} color="#c1c7d2" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Daily Learning Section */}
        <Text style={styles.sectionTitle}>每日学习</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => setShowNewWordsPicker(true)}>
            <Text style={styles.rowLabel}>每日新词数</Text>
            <View style={styles.rowRight}>
              <View style={styles.valueBadge}>
                <Text style={styles.valueBadgeText}>{newWordsPerDay}个</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#c1c7d2" />
            </View>
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity style={styles.row} onPress={() => setShowReviewPicker(true)}>
            <Text style={styles.rowLabel}>每日复习上限</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{reviewLimitPerDay}个</Text>
              <MaterialIcons name="chevron-right" size={20} color="#c1c7d2" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionTitle}>外观</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>深色模式</Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#e0e3e6', true: '#005ea1' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>版本</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>算法</Text>
            <Text style={styles.rowValue}>FSRS v4</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pickers */}
      <NumberPicker
        visible={showNewWordsPicker}
        title="设置每日新词数"
        subtitle="合理规划进度，确保持续记忆"
        options={newWordsOptions}
        currentValue={newWordsPerDay}
        onSelect={setNewWordsPerDay}
        onClose={() => setShowNewWordsPicker(false)}
      />
      <NumberPicker
        visible={showReviewPicker}
        title="设置每日复习上限"
        subtitle="合理规划复习量，巩固记忆"
        options={reviewLimitOptions}
        currentValue={reviewLimitPerDay}
        onSelect={setReviewLimitPerDay}
        onClose={() => setShowReviewPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  scrollView: { flex: 1 },
  content: { paddingBottom: 32 },
  sectionTitle: {
    fontSize: 12, fontWeight: '500', color: '#717782',
    textTransform: 'uppercase', letterSpacing: 0.05,
    paddingHorizontal: 24, marginTop: 24, marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 16,
    shadowColor: '#005ea1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 20,
    elevation: 1, borderWidth: 1, borderColor: 'rgba(193,199,210,0.15)', overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  rowLabel: { fontSize: 17, fontWeight: '400', color: '#191c1e' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 15, fontWeight: '400', color: '#414751' },
  rowDivider: { height: 1, backgroundColor: '#e6e8eb', marginLeft: 16 },
  valueBadge: {
    backgroundColor: 'rgba(0,94,161,0.1)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  valueBadgeText: { fontSize: 15, fontWeight: '500', color: '#005ea1' },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(25,28,30,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 24,
    width: '100%', maxWidth: 360,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#191c1e' },
  modalSubtitle: { fontSize: 12, fontWeight: '500', color: '#717782', marginTop: 4 },
  optionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20,
  },
  optionBtn: {
    flex: 1, minWidth: '28%', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#e0e3e6',
    alignItems: 'center', backgroundColor: '#ffffff',
  },
  optionBtnActive: {
    backgroundColor: '#005ea1', borderColor: '#005ea1',
    shadowColor: '#005ea1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 3,
  },
  optionBtnText: { fontSize: 15, fontWeight: '400', color: '#191c1e' },
  optionBtnTextActive: { color: '#ffffff', fontWeight: '600' },
  customLabel: { fontSize: 12, fontWeight: '500', color: '#414751', marginBottom: 8 },
  customInput: {
    backgroundColor: '#f2f4f7', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, color: '#191c1e', marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#f2f4f7', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '500', color: '#414751' },
  confirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#005ea1', alignItems: 'center',
    shadowColor: '#005ea1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
});
