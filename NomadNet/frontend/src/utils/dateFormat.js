import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';

export const formatMessageTime = (date) => {
  if (!date) return '';
  
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return 'Yesterday';
  } else if (isThisWeek(messageDate)) {
    return format(messageDate, 'EEE');
  } else {
    return format(messageDate, 'dd/MM/yyyy');
  }
};

export const formatMessageTimestamp = (date) => {
  if (!date) return '';
  return format(new Date(date), 'HH:mm');
};

export const formatLastActive = (date) => {
  if (!date) return 'Unknown';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const groupMessagesByDate = (messages) => {
  const groups = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt);
    let key;
    
    if (isToday(date)) {
      key = 'Today';
    } else if (isYesterday(date)) {
      key = 'Yesterday';
    } else {
      key = format(date, 'MMMM dd, yyyy');
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
  });
  
  return groups;
};