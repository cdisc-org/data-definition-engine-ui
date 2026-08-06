import React from 'react';
import { useAppSelector } from '@redux/hooks';
import ErrorModal from '@components/Modal/ErrorModal';
import { modals as modalNames } from '@/misc/constants';
import { IUiModal } from '@interfaces/store';

const MODAL_COMPONENTS = {
  [modalNames.ERROR]: ErrorModal,
};

const ModalRoot: React.FC = () => {
  const modals = useAppSelector((state) => state.ui.modals);
  if (modals.length === 0) {
    return null;
  }

  const result: React.JSX.Element[] = [];
  modals.forEach((modal) => {
    const Modal = MODAL_COMPONENTS[modal.type] as React.FC<IUiModal>;
    result.push(<Modal key={modal.type} {...modal} />);
  });
  return result;
};

export default ModalRoot;
