import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CreateTicketStepper } from '../../../src/features/tickets/components/CreateTicketStepper';
import { CreateTicketSuccess } from '../../../src/features/tickets/components/CreateTicketSuccess';
import { useCreateTicket } from '../../../src/features/tickets/hooks/useCreateTicket';
import { useMyBatteryAssets } from '../../../src/features/batteries/hooks/useMyBatteryAssets';
import { TicketCategoryEnum } from '../../../src/features/tickets/types/ticket.types';
import type { UploadedTicketAttachment } from '../../../src/features/tickets/types/ticket.types';
import { Colors } from '../../../src/lib/theme';

export default function CreateTicketScreen() {
  const insets = useSafeAreaInsets();
  const { mutateAsync, isPending } = useCreateTicket();
  const { data: batteries = [] } = useMyBatteryAssets();

  const [step, setStep] = useState(1);
  const [selectedBatteryId, setSelectedBatteryId] = useState<string | null>(null);
  const [category, setCategory] = useState<TicketCategoryEnum | ''>('');
  const [description, setDescription] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<UploadedTicketAttachment[]>([]);

  const [createdTicketCode, setCreatedTicketCode] = useState<string>('');
  const [createdTicketId, setCreatedTicketId] = useState<string>('');

  const handleCancel = () => {
    Alert.alert(
      'Cancel ticket',
      'Are you sure? All entered information will be lost.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!category || description.length < 10) return;

    const categoryLabels: Record<TicketCategoryEnum, string> = {
      Charging: 'Charging Issue',
      Overheat: 'Overheat',
      NoPower: 'No Power',
      Performance: 'Poor Performance',
      Repair: 'Repair Request',
      Other: 'Other Request',
    };

    const catLabel = categoryLabels[category as TicketCategoryEnum] ?? 'Support Request';
    const battery = batteries.find((b) => b.id === selectedBatteryId);
    const title = battery ? `${catLabel} - ${battery.serialNumber}` : catLabel;

    try {
      const res = await mutateAsync({
        title,
        description,
        category: category as TicketCategoryEnum,
        batteryAssetId: selectedBatteryId ?? undefined,
        attachments: attachedFiles.length > 0
          ? attachedFiles.map((file) => ({
              fileId: file.fileId,
              fileName: file.fileName,
              contentType: file.contentType,
              sizeBytes: file.sizeBytes,
            }))
          : undefined,
      });

      const dataDto = res.data?.data;
      if (res.data?.isSuccess && dataDto) {
        setCreatedTicketCode(dataDto.code ?? 'T-SUCCESS');
        setCreatedTicketId(dataDto.id ?? '');
        setStep(5);
      } else {
        throw new Error(res.data?.message ?? 'System error occurred');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not create ticket. Please try again.');
    }
  };

  const handleViewDetails = () => {
    if (createdTicketId) {
      router.replace({
        pathname: '/(customer)/tickets/[id]',
        params: { id: createdTicketId },
      });
    } else {
      router.back();
    }
  };

  const handleBackToList = () => {
    router.dismissAll();
    router.replace('/(customer)/(tabs)/tickets');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {step === 5 ? (
        <CreateTicketSuccess
          ticketCode={createdTicketCode}
          onViewDetails={handleViewDetails}
          onBackToList={handleBackToList}
        />
      ) : (
        <CreateTicketStepper
          step={step}
          setStep={setStep}
          selectedBatteryId={selectedBatteryId}
          setSelectedBatteryId={setSelectedBatteryId}
          category={category}
          setCategory={setCategory}
          description={description}
          setDescription={setDescription}
          attachedFiles={attachedFiles}
          setAttachedFiles={setAttachedFiles}
          onSubmit={handleSubmit}
          isLoading={isPending}
          onCancel={handleCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
