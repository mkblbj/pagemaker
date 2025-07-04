import { apiClient } from '@/lib/apiClient';
import type { 
  ShopConfiguration,
  CreateShopConfigurationRequest,
  UpdateShopConfigurationRequest,
  ApiResponse
} from '@pagemaker/shared-types';

export const shopService = {
  /**
   * 获取店铺配置列表
   */
  async getShopConfigurations(): Promise<ShopConfiguration[]> {
    const response = await apiClient.get<ApiResponse<ShopConfiguration[]>>('/api/v1/shop-configurations/');
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '获取店铺配置失败');
    }
    
    return response.data.data;
  },

  /**
   * 获取可用的目标区域列表
   */
  async getTargetAreas(): Promise<Array<{ value: string; label: string }>> {
    const configurations = await this.getShopConfigurations();
    return configurations.map(config => ({
      value: config.target_area,
      label: config.target_area === 'pc' ? 'PC端' : 
             config.target_area === 'mobile' ? '移动端' : 
             config.target_area.toUpperCase()
    }));
  },

  /**
   * 获取单个店铺配置
   */
  async getShopConfiguration(id: string): Promise<ShopConfiguration> {
    const response = await apiClient.get<ApiResponse<ShopConfiguration>>(`/api/v1/shop-configurations/${id}/`);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '获取店铺配置失败');
    }
    
    return response.data.data;
  },

  /**
   * 创建店铺配置
   */
  async createShopConfiguration(data: CreateShopConfigurationRequest): Promise<ShopConfiguration> {
    const response = await apiClient.post<ApiResponse<ShopConfiguration>>('/api/v1/shop-configurations/', data);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '创建店铺配置失败');
    }
    
    return response.data.data;
  },

  /**
   * 更新店铺配置
   */
  async updateShopConfiguration(id: string, data: UpdateShopConfigurationRequest): Promise<ShopConfiguration> {
    const response = await apiClient.patch<ApiResponse<ShopConfiguration>>(`/api/v1/shop-configurations/${id}/`, data);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || '更新店铺配置失败');
    }
    
    return response.data.data;
  },

  /**
   * 删除店铺配置
   */
  async deleteShopConfiguration(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/shop-configurations/${id}/`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || '删除店铺配置失败');
    }
  }
};

export default shopService; 